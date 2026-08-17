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
13. MULTI-TURN MEMORY: You receive prior messages in this session. Use them. If the user says "that", "those", "the previous", "same as before", "and the members?", resolve references from earlier turns. Do not pretend you forgot earlier answers. Only ask for clarification if the reference is genuinely ambiguous.
14. Never output tool-call markup, XML, or raw function names to the user — only natural language answers.

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
 * Strip any leaked tool-call markup from assistant text before showing to users.
 */
function stripToolCallMarkup(text) {
  if (!text || typeof text !== 'string') return text;
  return text
    // Remove entire tool_calls / tool_call blocks (hy3-free and standard)
    .replace(/<tool_calls(?::[^>\s]*)?>[\s\S]*?<\/tool_calls(?::[^>\s]*)?>/gi, '')
    .replace(/<tool_call(?::[^>\s]*)?>[\s\S]*?<\/tool_call(?::[^>\s]*)?>/gi, '')
    // Orphan open/close tags
    .replace(/<\/?tool_calls(?::[^>\s]*)?>/gi, '')
    .replace(/<\/?tool_call(?::[^>\s]*)?>/gi, '')
    // leftover bare tool lines like "zignalyft.analytics.dashboard"
    .replace(/^[ \t]*(?:zignalyft|zignastay|vigil)\.[a-z0-9_.]+[ \t]*$/gim, '')
    // leftover param lines from tool dumps
    .replace(/^[ \t]*(?:from|to|status|search|range|memberId|instructorId)\s*[:=]\s*\S+[ \t]*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Parse tool calls from text when models dump them as markup instead of
 * proper OpenAI tool_calls. Primary format from hy3-free:
 *
 *   I'll fetch X.
 *   <tool_calls:abc>
 *   <tool_call:abc>zignalyft.analytics.dashboard
 *     from: 2026-08-01
 *     to: 2026-08-17
 *   </tool_call:abc>
 *   </tool_calls:abc>
 */
function parseTextToolCalls(text, tools) {
  if (!text || !tools?.length) return [];

  const toolNames = new Set(tools.map((t) => t.name));
  const sortedNames = [...toolNames].sort((a, b) => b.length - a.length);
  const calls = [];
  const seen = new Set();

  const pushCall = (name, args) => {
    if (!toolNames.has(name)) return;
    const key = `${name}:${JSON.stringify(args || {})}`;
    if (seen.has(key)) return;
    seen.add(key);
    calls.push({
      id: `text-${Date.now()}-${calls.length}`,
      name,
      args: args || {},
    });
  };

  const parseArgsFromBlock = (block) => {
    const args = {};
    // "from: 2026-08-01" or "from 2026-08-01"
    const kvRe = /(?:^|\n)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*[:=]\s*([^\n<]+)/g;
    let m;
    while ((m = kvRe.exec(block)) !== null) {
      const key = m[1].trim();
      const value = m[2].trim().replace(/^["']|["']$/g, '');
      if (key && !toolNames.has(key) && key !== 'name') {
        args[key] = value;
      }
    }
    return args;
  };

  // Format 1a: hy3-free <tool_call:ID> ... </tool_call:ID>
  const hy3Blocks = text.matchAll(/<tool_call(?::[^>\s]*)?>([\s\S]*?)<\/tool_call(?::[^>\s]*)?>/gi);
  for (const match of hy3Blocks) {
    const inner = match[1].trim();
    let toolName = null;
    for (const name of sortedNames) {
      if (inner.includes(name) || new RegExp(`^\\s*${name.replace(/\./g, '\\.')}`, 'i').test(inner)) {
        toolName = name;
        break;
      }
    }
    if (toolName) pushCall(toolName, parseArgsFromBlock(inner));
  }

  // Format 1b: standard <tool_call>...</tool_call> already covered above via optional :ID

  // Format 1c: whole <tool_calls:ID>...</tool_calls:ID> if no individual blocks matched
  if (calls.length === 0) {
    const wrapper = text.match(/<tool_calls(?::[^>\s]*)?>([\s\S]*?)<\/tool_calls(?::[^>\s]*)?>/i);
    if (wrapper) {
      const inner = wrapper[1];
      // Split on tool name occurrences
      for (const name of sortedNames) {
        const re = new RegExp(`${name.replace(/\./g, '\\.')}([\\s\\S]*?)(?=zignalyft\\.|zignastay\\.|vigil\\.|$|<\\/|$)`, 'gi');
        let m;
        while ((m = re.exec(inner)) !== null) {
          pushCall(name, parseArgsFromBlock(m[1] || ''));
        }
      }
    }
  }

  // Format 2: JSON-style
  if (calls.length === 0) {
    const jsonPattern = /(?:tool_call|function_call|call)\s*(?:\(|:)\s*(\{[\s\S]*?\})/gi;
    let jsonMatch;
    while ((jsonMatch = jsonPattern.exec(text)) !== null) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.name && toolNames.has(parsed.name)) {
          pushCall(parsed.name, parsed.arguments || parsed.args || {});
        }
      } catch (e) { /* skip */ }
    }
  }

  // Format 3: bare tool name + nearby params (last resort, max 3 tools)
  if (calls.length === 0) {
    for (const toolName of sortedNames) {
      if (calls.length >= 3) break;
      const pattern = new RegExp(`\\b${toolName.replace(/\./g, '\\.')}\\b`, 'i');
      if (!pattern.test(text)) continue;
      const toolDef = tools.find((t) => t.name === toolName);
      const args = {};
      if (toolDef?.parameters?.properties) {
        for (const paramName of Object.keys(toolDef.parameters.properties)) {
          const paramPattern = new RegExp(`${paramName}\\s*[:=]\\s*([\\w\\-.]+)`, 'i');
          const paramMatch = text.match(paramPattern);
          if (paramMatch) args[paramName] = paramMatch[1];
        }
      }
      pushCall(toolName, args);
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
    const rawContent = choice?.message?.content || 'I could not determine an action for your request.';

    // Fallback: parse tool calls from text content (hy3-free dumps them as markup)
    if (tools?.length > 0) {
      const textToolCalls = parseTextToolCalls(rawContent, tools);
      if (textToolCalls.length > 0) {
        result.toolCalls = textToolCalls;
        result.tool = textToolCalls[0].name;
        result.args = textToolCalls[0].args;
        result.finishReason = 'tool_calls';
        // Keep preamble text if any; strip markup so it never leaks to the user
        const preamble = stripToolCallMarkup(rawContent);
        result.response = preamble || null;
        return result;
      }
    }

    result.response = stripToolCallMarkup(rawContent);
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
  stripToolCallMarkup,
  parseTextToolCalls,
};

