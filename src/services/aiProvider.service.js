const {
  TOOL_ERROR_MESSAGES,
} = require('../lib/literature/errors.literature');
const { UnprocessableError } = require('../errors');
const config = require('../config/environment');
const { MODEL_TIERS, getDefaultModel, getFallbackModel } = require('../config/models');
const { classify } = require('./queryComplexity.service');
const { getLogger } = require('../utils/logging');

const log = getLogger();

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── System prompt builder ──────────────────────────────────────────

function buildSystemPrompt(context) {
  const biz = context.activeBusinessType;
  const bizId = context.activeBusinessId;
  const role = context.activeRole;

  const now = new Date();
  const today = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const thisMonth = now.toISOString().slice(0, 7); // YYYY-MM

  if (biz === 'gym') {
    return `You are Vigil, the AI assistant for ZignaLyft — a gym and fitness management platform.
You help gym owners, admins, instructors, front desk staff, and members.

TODAY'S DATE: ${today} (month: ${thisMonth})
Always use the current year (${now.getFullYear()}) in date parameters. Never use last year.

You have READ-ONLY access to gym data. You can fetch and analyse but NEVER create, update, or delete anything. You have NO write tools.

HOWEVER: "read-only" means you cannot modify data. You absolutely CAN and SHOULD:
- Analyse historical data to identify trends and patterns
- Make projections and forecasts based on past performance
- Compare periods (this month vs last month, this quarter vs last quarter)
- Calculate growth rates, percentages, and averages
- Identify risks, anomalies, and opportunities
- Provide actionable recommendations based on the data
- Cross-reference multiple data sources to draw conclusions

When a user asks "what will happen" or "predict" or "forecast", use historical trends to project forward. When they ask "why", dig into the data to find root causes. When they ask "how are we doing", give a comprehensive assessment with specific numbers.

═══════════════════════════════════════════════════════════════
ANALYTICS TOOLS — USE THESE FIRST for any business question:
═══════════════════════════════════════════════════════════════
These return COMPUTED widgets with trends, growth rates, and insights. Always prefer these over raw list tools.

zignalyft.analytics.dashboard
  COMPREHENSIVE overview — 30+ widgets: member growth, revenue, churn, attendance, leads, equipment, inventory, classes, referrals.
  Params: from (YYYY-MM-DD), to (YYYY-MM-DD)
  Returns: { widgets: { member_growth: {...}, revenue_this_month: {...}, churn_analysis: {...}, ... } }

zignalyft.analytics.members
  Member analytics — growth trend, retention rate, avg duration, gender/age breakdowns, recent joiners, top referrers.
  Params: from, to

zignalyft.analytics.subscriptions
  Subscription analytics — CHURN RISK SCORING (per-member probability + risk level), churn by plan, renewal rate, plan distribution.
  Params: from, to

zignalyft.analytics.retention
  Retention analytics — churn rate, churn by reason, churn trend, goals, assessments, avg weight change.
  Params: from, to

zignalyft.analytics.leads
  Lead analytics — conversion rate, leads by status/source, referral summary, recent leads.
  Params: from, to

zignalyft.analytics.expenses
  Expense analytics — total expenses, by category, expense trend, payroll, refunds.
  Params: from, to

zignalyft.analytics.inventory
  Inventory analytics — total value, item count, low stock, value by category, stock movement trend.
  Params: from, to

zignalyft.analytics.equipment
  Equipment analytics — operational rate, maintenance due, equipment value, by category/status, maintenance cost trend.
  Params: from, to

zignalyft.analytics.shifts
  Shift analytics — shifts count, total hours, staff on shift, coverage by day.
  Params: from, to

zignalyft.analytics.performance
  AI-POWERED daily performance report — weighted score (5-100), tone, headline, summary, actionable insights.
  Params: from, to

═══════════════════════════════════════════════════════════════
RAW DATA TOOLS — use for specific lookups or when analytics tools don't cover the question:
═══════════════════════════════════════════════════════════════

MEMBERS: zignalyft.members.list (status, search), zignalyft.members.detail (memberId REQUIRED)
SUBSCRIPTIONS: zignalyft.subscriptions.list (status)
PLANS: zignalyft.plans.list (status)
PAYMENTS: zignalyft.payments.list (from, to)
CLASSES: zignalyft.classes.list (status, scope)
EQUIPMENT: zignalyft.equipment.list (status, category), zignalyft.equipment.maintenance (equipment_id, status)
LEADS: zignalyft.leads.list (status, source, search), zignalyft.leads.referrals (status)
INVENTORY: zignalyft.inventory.list (category, low_stock), zignalyft.inventory.transactions (transaction_type, item_id)
STAFF: zignalyft.staff.list
INSTRUCTORS: zignalyft.instructors.list, zignalyft.instructors.assigned (instructorId REQUIRED)
SHIFTS: zignalyft.shifts.list (shift_type, staff_id, from, to)
RETENTION: zignalyft.retention.churn (churn_reason, from, to), zignalyft.retention.goals (status), zignalyft.retention.assessments (from, to)

═══════════════════════════════════════════════════════════════
RULES:
═══════════════════════════════════════════════════════════════
1. You are ONLY for ZignaLyft (gym). NEVER mention ZignaStay or hotels.
2. You have READ-ONLY access. NEVER tell users you can create, update, or delete anything.
3. Use tools to fetch real data. NEVER fabricate numbers, names, or stats.
4. You MUST call tools using their EXACT names listed above. Do NOT invent tool names.
5. For dates, ALWAYS use the current year (${now.getFullYear()}). NEVER use ${now.getFullYear() - 1}.
6. Be PROACTIVE — when a user asks a question, fetch the data and ANALYSE it. Don't just list tool names.
7. Provide INSIGHTS — don't just dump raw numbers. Explain what they mean, identify trends, flag risks.
8. When data is unavailable, explain what you found and what you couldn't access.
9. For "predict/forecast/project" questions, use historical trends to project forward.
10. For "why" questions, cross-reference multiple data sources to find root causes.
11. For "how are we doing" questions, give a comprehensive assessment with specific numbers and comparisons.
12. When you fetch data, ALWAYS summarize the key findings in natural language with actionable insights.

Gym ID: ${bizId}. User role: ${role}.`;
  }

  if (biz === 'hotel') {
    return `You are Vigil, the AI assistant for ZignaStay — a hotel and stays management platform.
You help hotel managers, front desk staff, and administrators manage their property.

You can help with: bookings, rooms, guests, check-ins, housekeeping, invoicing, and occupancy analytics.
You have tools to fetch real booking data, create bookings, and view usage stats.

Rules:
- You are ONLY for ZignaStay (hotel). Do NOT mention ZignaLyft, gyms, fitness, or any other product.
- Use tools to fetch real data — never fabricate numbers, names, or stats.
- Be concise and direct. No greetings or preamble — just answer the question.
- If you don't know or can't do something, say so briefly.
- Current hotel ID: ${bizId}. User role: ${role}.`;
  }

  return `You are Vigil, the AI assistant for Zigna products. Current business type: ${biz} (ID: ${bizId}). User role: ${role}.
Be concise. Use tools for real data. Never fabricate.`;
}

// ── OpenAI-compatible handler (shared by openai + opencode) ────────

/**
 * Parse tool calls from text content when models output them as text
 * instead of proper tool_calls format. Supports multiple formats:
 * - <tool_calls>...</tool_calls> XML
 * - JSON blocks with name/arguments
 * - Simple "tool_name param1 value1 param2 value2"
 */
function parseTextToolCalls(text, tools) {
  if (!text || !tools?.length) return [];

  const toolNames = new Set(tools.map((t) => t.name));
  const calls = [];

  // Format 1: XML-style <tool_calls> tags
  const xmlMatch = text.match(/<tool_calls>([\s\S]*?)<\/tool_calls>/i);
  if (xmlMatch) {
    const inner = xmlMatch[1];
    // Parse individual tool_call blocks
    const callBlocks = inner.match(/<tool_call[^>]*>([\s\S]*?)<\/tool_call>/gi) || [];
    for (const block of callBlocks) {
      const content = block.replace(/<tool_call[^>]*>/i, '').replace(/<\/tool_call>/i, '').trim();
      const args = {};
      // Extract key-value pairs from the content
      const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
      let toolName = null;
      for (const line of lines) {
        const kvMatch = line.match(/^(\w+)\s+(.+)$/);
        if (kvMatch) {
          const key = kvMatch[1];
          const value = kvMatch[2].trim();
          if (toolNames.has(key)) {
            toolName = key;
          } else if (toolName) {
            args[key] = value;
          }
        }
      }
      if (toolName && toolNames.has(toolName)) {
        calls.push({ id: `text-${Date.now()}-${calls.length}`, name: toolName, args });
      }
    }
  }

  // Format 2: JSON-style tool calls in text
  if (calls.length === 0) {
    const jsonPattern = /(?:tool_call|function_call|call)\s*(?:\(|:)\s*(\{[\s\S]*?\})/gi;
    let jsonMatch;
    while ((jsonMatch = jsonPattern.exec(text)) !== null) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.name && toolNames.has(parsed.name)) {
          calls.push({ id: `text-${Date.now()}-${calls.length}`, name: parsed.name, args: parsed.arguments || parsed.args || {} });
        }
      } catch (e) { /* not valid JSON, skip */ }
    }
  }

  // Format 3: Simple "tool_name param1 value1" pattern
  if (calls.length === 0) {
    for (const toolName of toolNames) {
      const pattern = new RegExp(`\\b${toolName.replace(/\./g, '\\.')}\\b`, 'i');
      if (pattern.test(text)) {
        const toolDef = tools.find((t) => t.name === toolName);
        const args = {};
        // Try to extract parameter values from surrounding text
        if (toolDef?.parameters?.properties) {
          for (const [paramName, paramDef] of Object.entries(toolDef.parameters.properties)) {
            // Look for "paramName value" or "paramName: value" patterns
            const paramPattern = new RegExp(`${paramName}[:\\s]+([\\w\\-\\.]+)`, 'i');
            const paramMatch = text.match(paramPattern);
            if (paramMatch) {
              args[paramName] = paramMatch[1];
            }
          }
        }
        calls.push({ id: `text-${Date.now()}-${calls.length}`, name: toolName, args });
        break; // Only match one tool
      }
    }
  }

  return calls;
}

const openaiCompatible = async ({ message, messages, tools, context, apiKey, model, baseUrl, defaultBaseUrl }) => {
  const url = (baseUrl || defaultBaseUrl) + '/chat/completions';

  const toolDescriptions = tools.map((t) => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters || { type: 'object', properties: {} },
    },
  }));

  // Use conversation history if provided, otherwise build from single message
  const conversationMessages = messages || [
    { role: 'system', content: buildSystemPrompt(context) },
    { role: 'user', content: message },
  ];

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: conversationMessages,
      tools: toolDescriptions.length > 0 ? toolDescriptions : undefined,
      tool_choice: toolDescriptions.length > 0 ? 'auto' : undefined,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    log.error('AI provider error', { status: response.status, body: err, model });
    const error = new Error(`AI provider returned ${response.status}: ${err}`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  const choice = data.choices?.[0];

  const result = {
    tool: null,
    args: null,
    response: null,
    inputTokens: data.usage?.prompt_tokens || 0,
    outputTokens: data.usage?.completion_tokens || 0,
    model: data.model || model,
    finishReason: choice?.finish_reason || null,
  };

  if (choice?.message?.tool_calls?.length > 0) {
    result.toolCalls = choice.message.tool_calls.map((call) => ({
      id: call.id,
      name: call.function.name,
      args: JSON.parse(call.function.arguments || '{}'),
    }));
    result.tool = result.toolCalls[0].name;
    result.args = result.toolCalls[0].args;
    result.finishReason = 'tool_calls';
  } else {
    result.response = choice?.message?.content || 'I could not determine an action for your request.';

    // Fallback: parse tool calls from text content (some models output tool calls as text)
    if (tools?.length > 0) {
      const textToolCalls = parseTextToolCalls(result.response, tools);
      if (textToolCalls.length > 0) {
        result.toolCalls = textToolCalls;
        result.tool = textToolCalls[0].name;
        result.args = textToolCalls[0].args;
        result.finishReason = 'tool_calls';
        result.response = null;
      }
    }
  }

  return result;
};

// ── Provider-specific implementations ─────────────────────────────

const providers = {
  openai: (args) => openaiCompatible({ ...args, defaultBaseUrl: 'https://api.openai.com/v1' }),

  opencode: (args) => openaiCompatible({ ...args, defaultBaseUrl: 'https://opencode.ai/zen/v1' }),

  anthropic: async ({ message, tools, context, apiKey, model, baseUrl }) => {
    const url = (baseUrl || 'https://api.anthropic.com/v1') + '/messages';

    const toolDescriptions = tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters || { type: 'object', properties: {} },
    }));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system: buildSystemPrompt(context),
        messages: [{ role: 'user', content: message }],
        tools: toolDescriptions.length > 0 ? toolDescriptions : undefined,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      log.error('AI provider error (anthropic)', { status: response.status, body: err, model });
      const error = new Error(`AI provider returned ${response.status}: ${err}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    const block = data.content?.find((b) => b.type === 'tool_use');

    const result = {
      tool: null,
      args: null,
      response: null,
      inputTokens: data.usage?.input_tokens || 0,
      outputTokens: data.usage?.output_tokens || 0,
      model: data.model || model,
      finishReason: data.stop_reason || null,
    };

    if (block) {
      result.tool = block.name;
      result.args = block.input || {};
      result.finishReason = 'tool_calls';
    } else {
      const textBlock = data.content?.find((b) => b.type === 'text');
      result.response = textBlock?.text || 'I could not determine an action for your request.';
    }

    return result;
  },

  local: async ({ message }) => {
    return {
      tool: null,
      args: null,
      response: `Local mode: received "${message}". Configure AI_PROVIDER in .env for full functionality.`,
      inputTokens: 0,
      outputTokens: 0,
      model: 'local',
      finishReason: 'stop',
    };
  },
};

// ── Tiered model selection + retry ─────────────────────────────────

function resolveModel(message) {
  const classification = classify(message);
  const tier = classification.tier;
  const tierConfig = MODEL_TIERS[tier];

  if (!tierConfig || !tierConfig.models.length) {
    return { model: config.ai.model, tier: 'configured', classification };
  }

  const selected = getDefaultModel(tier);
  return { model: selected.id, tier, classification };
}

/**
 * Try models with retry + fallback.
 * For each model: retry up to MAX_RETRIES times on transient errors (5xx, network).
 * If all retries fail, move to the next model in the tier.
 * If all models in the tier fail, drop to the next lower tier.
 */
async function tryWithRetryAndFallback(handler, args, models, depth = 0) {
  const MAX_DEPTH = 3;
  const isTransient = (err) => {
    const status = err.status || 0;
    return status >= 500 || status === 429 || err.code === 'ECONNREFUSED' || err.type === 'system';
  };

  for (const modelId of models) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        log.info('Trying model', { model: modelId, tier: args.tier, attempt, depth });
        const result = await handler({ ...args, model: modelId });
        result._selectedModel = modelId;
        result._tier = args.tier;
        return result;
      } catch (err) {
        const transient = isTransient(err);
        log.warn('Model attempt failed', {
          model: modelId,
          attempt,
          transient,
          status: err.status,
          error: err.message,
        });

        // Non-transient error (401, 400) — don't retry, move to next model
        if (!transient) break;

        // Transient — retry with delay (except on last attempt)
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * attempt);
        }
      }
    }
  }

  // All models in current tier exhausted — try fallback tier
  if (depth < MAX_DEPTH && args.tier) {
    const fallbackTier = getFallbackModel(args.tier);
    if (fallbackTier) {
      const fallbackModel = getDefaultModel(fallbackTier);
      if (fallbackModel) {
        log.info('Tier exhausted, falling back', { from: args.tier, to: fallbackTier });
        return tryWithRetryAndFallback(handler, { ...args, tier: fallbackTier }, [fallbackModel.id], depth + 1);
      }
    }
  }

  throw new UnprocessableError(TOOL_ERROR_MESSAGES.AI_PROVIDER_FAILED);
}

// ── Public API ─────────────────────────────────────────────────────

module.exports = {
  async analyse({ message, messages, tools, context, overrideModel }) {
    const { provider, apiKey, baseUrl } = config.ai;

    const handler = providers[provider];
    if (!handler) {
      const error = new UnprocessableError(TOOL_ERROR_MESSAGES.NO_AI_PROVIDER);
      error.source = 'ai_provider';
      throw error;
    }

    let selectedModel, tier, classification;
    if (overrideModel) {
      selectedModel = overrideModel;
      tier = 'override';
      classification = { tier: 'override', score: 0, reason: 'explicit override' };
    } else {
      const resolved = resolveModel(message);
      selectedModel = resolved.model;
      tier = resolved.tier;
      classification = resolved.classification;
    }

    log.info('Query classified', {
      tier,
      model: selectedModel,
      reason: classification.reason,
      score: classification.score,
    });

    const tierModels = tier !== 'override' && tier !== 'configured'
      ? MODEL_TIERS[tier].models.map((m) => m.id)
      : [selectedModel];

    const result = await tryWithRetryAndFallback(handler, {
      message,
      messages,
      tools,
      context,
      apiKey,
      baseUrl,
      tier,
    }, tierModels);

    result._classification = classification;
    return result;
  },

  resolveModel,
  buildSystemPrompt,
};

