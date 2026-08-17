const { v4: uuidv4 } = require('uuid');
const aiProvider = require('./aiProvider.service');
const toolRegistry = require('../tools/registry');
const toolAuthorization = require('./toolAuthorization.service');
const toolCache = require('./toolCache.service');
const usageService = require('./usage.service');
const config = require('../config/environment');
const sequelize = require('../config/database');
const { TOOL_ERROR_MESSAGES } = require('../lib/literature/errors.literature');
const { UnprocessableError, ForbiddenError } = require('../errors');
const { getLogger } = require('../utils/logging');

const log = getLogger();

const MAX_TOOL_ROUNDS = 5;

module.exports = {
  async processMessage({
    message,
    userId,
    activeBusinessId,
    productId,
    productSlug,
    activeBusinessType,
    activeRole,
    isSuperAdmin,
    businessName,
    userFullname,
    userEmail,
    sessionId: existingSessionId,
  }) {
    const startTime = Date.now();
    const requestId = uuidv4();

    // Resolve or create session
    let sessionId = existingSessionId;
    let isNewSession = false;

    if (!sessionId) {
      sessionId = uuidv4();
      isNewSession = true;
    }

    // Persist session, messages, tool executions, AI interactions
    // All non-blocking — conversation completes even if DB write fails
    const persistCtx = {
      sessionId,
      isNewSession,
      productId,
      productSlug,
      businessId: activeBusinessId,
      businessName,
      userId,
      userFullname,
      userEmail,
      role: activeRole,
      requestId,
    };

    // 1. Build context for the AI
    const context = {
      userId,
      activeBusinessId,
      activeBusinessType,
      activeRole,
      isSuperAdmin,
    };

    // 2. Get tools the user is allowed to access
    const accessibleToolNames = toolAuthorization.getAccessibleTools(activeRole, toolRegistry);
    const accessibleTools = accessibleToolNames.map((name) => toolRegistry[name]);

    // 3. Build conversation history for tool loop
    const systemPrompt = aiProvider.buildSystemPrompt(context);
    const conversationHistory = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ];

    // 4. Tool execution loop — keep calling AI until it returns a text response
    let finalResponse = null;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let lastResult = null;
    let toolsUsed = [];
    const executedToolCalls = new Set(); // Track tool+args to prevent loops

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const aiStartTime = Date.now();
      const result = await aiProvider.analyse({
        message,
        messages: conversationHistory,
        tools: accessibleTools,
        context,
      });
      const aiLatencyMs = Date.now() - aiStartTime;

      totalInputTokens += result.inputTokens || 0;
      totalOutputTokens += result.outputTokens || 0;
      lastResult = result;

      // No tool calls — AI returned a text response, we're done
      if (result.finishReason !== 'tool_calls' || !result.toolCalls) {
        finalResponse = result.response;
        break;
      }

      // Execute all tool calls (parallel)
      const toolCalls = result.toolCalls;
      const toolResults = await Promise.all(
        toolCalls.map(async (tc) => {
          const toolKey = `${tc.name}:${JSON.stringify(tc.args)}`;
          if (executedToolCalls.has(toolKey)) {
            return { id: tc.id, name: tc.name, error: 'Already executed this call' };
          }
          executedToolCalls.add(toolKey);

          const tool = toolRegistry[tc.name];
          if (!tool) {
            return { id: tc.id, name: tc.name, error: 'Tool not found' };
          }

          // Authorization check
          if (!isSuperAdmin) {
            const hasPermission = tool.requiredPermissions.some((p) =>
              toolAuthorization.hasPermission(activeRole, p)
            );
            if (!hasPermission) {
              return { id: tc.id, name: tc.name, error: 'Unauthorized' };
            }
          }

          try {
            toolsUsed.push(tc.name);

            // Check cache first
            const cached = toolCache.get(activeBusinessId, tc.name, tc.args);
            if (cached !== null) {
              return { id: tc.id, name: tc.name, result: cached, fromCache: true };
            }

            // Cache miss — execute tool
            const toolResult = await tool.handler({
              businessId: activeBusinessId,
              businessType: activeBusinessType,
              userId,
              args: tc.args,
            });

            // Store in cache
            toolCache.set(activeBusinessId, tc.name, tc.args, toolResult);

            return { id: tc.id, name: tc.name, result: toolResult };
          } catch (err) {
            return { id: tc.id, name: tc.name, error: err.message };
          }
        })
      );

      // Add assistant message with tool calls to history
      conversationHistory.push({
        role: 'assistant',
        tool_calls: toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function',
          function: { name: tc.name, arguments: JSON.stringify(tc.args) },
        })),
      });

      // Add tool results to history
      for (const tr of toolResults) {
        conversationHistory.push({
          role: 'tool',
          tool_call_id: tr.id,
          content: tr.error
            ? JSON.stringify({ error: tr.error })
            : JSON.stringify(tr.result),
        });
      }
    }

    // If we exhausted all rounds without a text response, make one final AI call
    // with all accumulated tool results, asking for a summary
    if (finalResponse === null && lastResult) {
      if (toolsUsed.length > 0) {
        // Make one more AI call with tool results context, forcing a text response
        conversationHistory.push({
          role: 'user',
          content: 'You now have all the data. Summarise the key findings in natural language with actionable insights. Do NOT call any more tools.',
        });
        try {
          const summaryResult = await aiProvider.analyse({
            message: 'Summarise the data',
            messages: conversationHistory,
            tools: [], // No tools — force text response
            context,
          });
          finalResponse = summaryResult.response || 'I fetched the data but could not generate a summary.';
          totalInputTokens += summaryResult.inputTokens || 0;
          totalOutputTokens += summaryResult.outputTokens || 0;
        } catch (e) {
          finalResponse = 'I fetched the data but could not generate a summary.';
        }
      } else {
        finalResponse = lastResult.response || 'I fetched the data but could not generate a summary.';
      }
    }

    const durationMs = Date.now() - startTime;

    // 5. Persist inbound message + session (non-blocking)
    this._persistInbound(persistCtx, message).catch((err) => {
      log.warn('Failed to persist inbound message', { error: err.message, requestId });
    });

    // 6. Persist outbound message + tool executions + AI interaction (non-blocking)
    this._persistOutbound(persistCtx, {
      toolName: toolsUsed.length > 0 ? toolsUsed.join(', ') : null,
      toolArgs: null,
      toolResult: null,
      toolDurationMs: 0,
      permissionUsed: null,
      aiResult: lastResult,
      aiLatencyMs: 0,
      durationMs,
      toolsOffered: accessibleToolNames,
    }).catch((err) => {
      log.warn('Failed to persist outbound message', { error: err.message, requestId });
    });

    // Record usage (non-blocking)
    usageService.record({
      activeBusinessId,
      activeBusinessType,
      userId,
      toolName: toolsUsed.length > 0 ? toolsUsed.join(', ') : null,
      aiProvider: config.ai.provider,
      aiModel: lastResult?.model || config.ai.model,
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      toolExecuted: toolsUsed.length > 0,
      durationMs,
    });

    return {
      response: finalResponse,
      sessionId,
      toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
    };
  },

  async _persistInbound(ctx, message) {
    const t = await sequelize.transaction();
    try {
      if (ctx.isNewSession) {
        await sequelize.query(
          `INSERT INTO vigil_sessions (id, product_id, product_slug, business_id, business_name, user_id, user_fullname, user_email, role, started_at, last_active_at, message_count, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), 1, 1)`,
          { replacements: [ctx.sessionId, ctx.productId, ctx.productSlug, ctx.businessId, ctx.businessName, ctx.userId, ctx.userFullname, ctx.userEmail || null, ctx.role], transaction: t }
        );
      } else {
        await sequelize.query(
          `UPDATE vigil_sessions SET last_active_at = NOW(), message_count = message_count + 1 WHERE id = ? AND is_active = 1`,
          { replacements: [ctx.sessionId], transaction: t }
        );
      }

      await sequelize.query(
        `INSERT INTO vigil_messages (id, session_id, product_id, product_slug, business_id, business_name, user_id, user_fullname, user_email, role, request_id, direction, content, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'inbound', ?, 'success', NOW())`,
        { replacements: [uuidv4(), ctx.sessionId, ctx.productId, ctx.productSlug, ctx.businessId, ctx.businessName, ctx.userId, ctx.userFullname, ctx.userEmail || null, ctx.role, ctx.requestId, message], transaction: t }
      );

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  async _persistOutbound(ctx, data) {
    const t = await sequelize.transaction();
    try {
      const outboundMessageId = uuidv4();

      await sequelize.query(
        `INSERT INTO vigil_messages (id, session_id, product_id, product_slug, business_id, business_name, user_id, user_fullname, user_email, role, request_id, direction, content, ai_provider, ai_model, input_tokens, output_tokens, duration_ms, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'outbound', ?, ?, ?, ?, ?, ?, 'success', NOW())`,
        {
          replacements: [
            outboundMessageId, ctx.sessionId, ctx.productId, ctx.productSlug,
            ctx.businessId, ctx.businessName, ctx.userId, ctx.userFullname, ctx.userEmail || null,
            ctx.role, ctx.requestId,
            data.toolName ? `Tool: ${data.toolName}` : (data.aiResult.response || ''),
            data.aiResult.model || config.ai.provider,
            data.aiResult.model,
            data.aiResult.inputTokens || 0,
            data.aiResult.outputTokens || 0,
            data.durationMs,
          ],
          transaction: t,
        }
      );

      // AI interaction row
      await sequelize.query(
        `INSERT INTO vigil_ai_interactions (id, message_id, session_id, product_id, product_slug, business_id, business_name, user_id, user_fullname, provider, model, input_tokens, output_tokens, total_tokens, finish_reason, tools_offered, tool_selected, latency_ms, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'success', NOW())`,
        {
          replacements: [
            uuidv4(), outboundMessageId, ctx.sessionId,
            ctx.productId, ctx.productSlug, ctx.businessId, ctx.businessName, ctx.userId, ctx.userFullname,
            config.ai.provider,
            data.aiResult.model || config.ai.model,
            data.aiResult.inputTokens || 0,
            data.aiResult.outputTokens || 0,
            (data.aiResult.inputTokens || 0) + (data.aiResult.outputTokens || 0),
            data.aiResult.finishReason || null,
            JSON.stringify(data.toolsOffered || []),
            data.toolName ? data.toolName.slice(0, 255) : null,
            data.aiLatencyMs,
          ],
          transaction: t,
        }
      );

      // Tool execution row (if tool was called)
      if (data.toolName) {
        const resultSummary = data.toolResult
          ? JSON.stringify(data.toolResult).slice(0, 2000)
          : null;

        await sequelize.query(
          `INSERT INTO vigil_tool_executions (id, message_id, session_id, product_id, product_slug, business_id, business_name, user_id, user_fullname, tool_name, tool_args, tool_result_summary, tool_status, permission_used, duration_ms, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'success', ?, ?, NOW())`,
          {
            replacements: [
              uuidv4(), outboundMessageId, ctx.sessionId,
              ctx.productId, ctx.productSlug, ctx.businessId, ctx.businessName, ctx.userId, ctx.userFullname,
              data.toolName,
              JSON.stringify(data.toolArgs || {}),
              resultSummary,
              data.permissionUsed || null,
              data.toolDurationMs,
            ],
            transaction: t,
          }
        );
      }

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },
};
