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
/** Max prior turns (user+assistant pairs ~ 2 msgs each) loaded into the model */
const MAX_HISTORY_MESSAGES = 24;
/** Soft cap on chars of prior history content (keeps token use bounded) */
const MAX_HISTORY_CHARS = 24000;

module.exports = {
  /**
   * Load prior user/assistant turns for a session from MySQL.
   * Returns OpenAI-style { role, content }[] (no system message).
   */
  async loadSessionHistory(sessionId, { userId, businessId } = {}) {
    if (!sessionId) return [];

    try {
      const replacements = [sessionId];
      let ownership = '';
      if (userId != null) {
        ownership += ' AND user_id = ?';
        replacements.push(userId);
      }
      if (businessId != null) {
        ownership += ' AND business_id = ?';
        replacements.push(businessId);
      }

      // Newest first, then reverse so oldest is first for the model
      const [rows] = await sequelize.query(
        `SELECT direction, content, role
         FROM vigil_messages
         WHERE session_id = ? ${ownership}
           AND status = 'success'
           AND content IS NOT NULL
           AND TRIM(content) != ''
         ORDER BY created_at DESC
         LIMIT ?`,
        { replacements: [...replacements, MAX_HISTORY_MESSAGES] }
      );

      if (!rows?.length) return [];

      const chronological = [...rows].reverse();
      const history = [];
      let totalChars = 0;

      for (const row of chronological) {
        const isUser = row.direction === 'inbound';
        let content = String(row.content || '').trim();
        if (!content) continue;

        // Skip internal tool dump rows that slipped into older data
        if (!isUser && content.startsWith('Tool: ') && content.length < 200) continue;
        if (!isUser && content.startsWith('Tools used: ') && content.length < 200) continue;

        if (!isUser && aiProvider.stripToolCallMarkup) {
          content = aiProvider.stripToolCallMarkup(content);
        }
        if (!content) continue;

        // Truncate very long past turns
        if (content.length > 4000) {
          content = `${content.slice(0, 4000)}\n…[truncated]`;
        }

        if (totalChars + content.length > MAX_HISTORY_CHARS) break;
        totalChars += content.length;

        history.push({
          role: isUser ? 'user' : 'assistant',
          content,
        });
      }

      // Ensure we don't end on a dangling user message without reply
      // (model gets confused); drop trailing incomplete pairs only if last is user
      // — actually the NEW user message is appended after, so trailing assistant is fine.
      // If last history item is user (failed prior turn), keep it — still useful context.

      return history;
    } catch (err) {
      log.warn('Failed to load session history', { sessionId, error: err.message });
      return [];
    }
  },

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
    clientHistory = [],
  }) {
    const startTime = Date.now();
    const requestId = uuidv4();

    // Resolve or create session
    let sessionId = existingSessionId;
    let isNewSession = false;

    if (!sessionId) {
      sessionId = uuidv4();
      isNewSession = true;
    } else {
      // Validate session still exists and belongs to this user/business
      try {
        const [existing] = await sequelize.query(
          `SELECT id FROM vigil_sessions
           WHERE id = ? AND user_id = ? AND business_id = ? AND is_active = 1
           LIMIT 1`,
          { replacements: [sessionId, userId, activeBusinessId] }
        );
        if (!existing?.length) {
          // Stale client session id — start fresh (client history still used)
          sessionId = uuidv4();
          isNewSession = true;
        }
      } catch (err) {
        log.warn('Session lookup failed, starting new session', { error: err.message });
        sessionId = uuidv4();
        isNewSession = true;
      }
    }

    // Persist session, messages, tool executions, AI interactions
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

    // 3. Build multi-turn context
    // Primary: clientHistory (messages already shown in the chat UI — always in sync)
    // Fallback: DB session history (survives reload when client sends session_id only)
    const systemPrompt = aiProvider.buildSystemPrompt(context);

    let priorTurns = [];
    if (Array.isArray(clientHistory) && clientHistory.length > 0) {
      priorTurns = clientHistory
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({
          role: m.role,
          content:
            m.role === 'assistant' && aiProvider.stripToolCallMarkup
              ? aiProvider.stripToolCallMarkup(m.content)
              : m.content,
        }))
        .filter((m) => m.content && m.content.trim())
        .slice(-MAX_HISTORY_MESSAGES);

      // Drop trailing user message if it duplicates the new message (client may include it)
      if (
        priorTurns.length > 0 &&
        priorTurns[priorTurns.length - 1].role === 'user' &&
        priorTurns[priorTurns.length - 1].content.trim() === message.trim()
      ) {
        priorTurns = priorTurns.slice(0, -1);
      }
    } else if (!isNewSession) {
      priorTurns = await this.loadSessionHistory(sessionId, {
        userId,
        businessId: activeBusinessId,
      });
    }

    const conversationHistory = [
      { role: 'system', content: systemPrompt },
      ...priorTurns,
      { role: 'user', content: message },
    ];

    log.info('Conversation context built', {
      sessionId,
      priorTurns: priorTurns.length,
      source: clientHistory?.length ? 'client' : isNewSession ? 'none' : 'db',
      requestId,
    });

    // Persist inbound ASAP so the next concurrent request can see it from DB
    try {
      await this._persistInbound(persistCtx, message);
      persistCtx.isNewSession = false; // session row now exists
    } catch (err) {
      log.warn('Failed to persist inbound message (pre-AI)', { error: err.message, requestId });
    }

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
      if (result.finishReason !== 'tool_calls' || !result.toolCalls?.length) {
        finalResponse = aiProvider.stripToolCallMarkup
          ? aiProvider.stripToolCallMarkup(result.response)
          : result.response;
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
          finalResponse = aiProvider.stripToolCallMarkup(
            summaryResult.response || 'I fetched the data but could not generate a summary.'
          );
          totalInputTokens += summaryResult.inputTokens || 0;
          totalOutputTokens += summaryResult.outputTokens || 0;
        } catch (e) {
          finalResponse = 'I fetched the data but could not generate a summary.';
        }
      } else {
        finalResponse = aiProvider.stripToolCallMarkup(
          lastResult.response || 'I fetched the data but could not generate a summary.'
        );
      }
    }

    // Never leak tool markup to the client
    if (finalResponse) {
      finalResponse = aiProvider.stripToolCallMarkup(finalResponse);
    }

    const durationMs = Date.now() - startTime;

    // Inbound already persisted before AI call. Persist outbound + tools (non-blocking).
    this._persistOutbound(persistCtx, {
      toolName: toolsUsed.length > 0 ? [...new Set(toolsUsed)].join(', ') : null,
      toolsUsed: [...new Set(toolsUsed)],
      toolArgs: null,
      toolResult: null,
      toolDurationMs: 0,
      permissionUsed: null,
      aiResult: {
        ...(lastResult || {}),
        response: finalResponse,
        finishReason: toolsUsed.length > 0 ? (lastResult?.finishReason || 'stop') : lastResult?.finishReason,
      },
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
            data.aiResult?.response || (data.toolName ? `Tools used: ${data.toolName}` : ''),
            data.aiResult?.model || config.ai.provider,
            data.aiResult?.model,
            data.aiResult?.inputTokens || 0,
            data.aiResult?.outputTokens || 0,
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
            data.aiResult?.model || config.ai.model,
            data.aiResult?.inputTokens || 0,
            data.aiResult?.outputTokens || 0,
            (data.aiResult?.inputTokens || 0) + (data.aiResult?.outputTokens || 0),
            data.aiResult?.finishReason || null,
            JSON.stringify(data.toolsOffered || []),
            data.toolName ? String(data.toolName).slice(0, 500) : null,
            data.aiLatencyMs,
          ],
          transaction: t,
        }
      );

      // One row per unique tool used
      const toolsList = data.toolsUsed?.length
        ? data.toolsUsed
        : (data.toolName ? data.toolName.split(',').map((s) => s.trim()).filter(Boolean) : []);

      for (const toolName of toolsList) {
        await sequelize.query(
          `INSERT INTO vigil_tool_executions (id, message_id, session_id, product_id, product_slug, business_id, business_name, user_id, user_fullname, tool_name, tool_args, tool_result_summary, tool_status, permission_used, duration_ms, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'success', ?, ?, NOW())`,
          {
            replacements: [
              uuidv4(), outboundMessageId, ctx.sessionId,
              ctx.productId, ctx.productSlug, ctx.businessId, ctx.businessName, ctx.userId, ctx.userFullname,
              toolName.slice(0, 100),
              JSON.stringify(data.toolArgs || {}),
              null,
              data.permissionUsed || null,
              data.toolDurationMs || 0,
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
