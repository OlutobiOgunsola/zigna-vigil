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

═══════════════════════════════════════════════════════════════
AVAILABLE TOOLS — use these EXACT names, no variations:
═══════════════════════════════════════════════════════════════

MEMBERS:
  zignalyft.members.list
    List members. Params: status (active|suspended|all), search (string)
  zignalyft.members.detail
    Single member full detail. Params: memberId (number, REQUIRED)
  zignalyft.members.analytics
    Member growth trends, status breakdown. Params: from (YYYY-MM-DD), to (YYYY-MM-DD)

SUBSCRIPTIONS:
  zignalyft.subscriptions.list
    List subscriptions. Params: status (active|expired|cancelled)
  zignalyft.subscriptions.analytics
    Subscription renewal rates, revenue. Params: from (YYYY-MM-DD), to (YYYY-MM-DD)

PLANS:
  zignalyft.plans.list
    List membership plans with pricing. Params: status (active|archived)

PAYMENTS:
  zignalyft.payments.list
    Payment history. Params: from (YYYY-MM-DD), to (YYYY-MM-DD)

CLASSES:
  zignalyft.classes.list
    Scheduled classes. Params: status (scheduled|completed|cancelled), scope (upcoming|all)

EQUIPMENT:
  zignalyft.equipment.list
    Gym equipment. Params: status (operational|maintenance|out_of_service|retired), category (cardio|strength|functional|mobility|accessory)
  zignalyft.equipment.analytics
    Equipment analytics. Params: from (YYYY-MM-DD), to (YYYY-MM-DD), range (today|this_week|this_month|last_month|last_3_months)
  zignalyft.equipment.maintenance
    Maintenance logs. Params: equipment_id (number), status (scheduled|in_progress|completed)

LEADS:
  zignalyft.leads.list
    Prospective members. Params: status (new|contacted|trial_booked|converted|lost), source (walk_in|referral|social_media|online_ad|website|event|other), search (string)
  zignalyft.leads.analytics
    Lead conversion analytics. Params: from (YYYY-MM-DD), to (YYYY-MM-DD)
  zignalyft.leads.referrals
    Referral program data. Params: status (pending|converted|declined)

INVENTORY:
  zignalyft.inventory.list
    Inventory items. Params: category (supplement|merchandise|accessory|other), low_stock (true|false)
  zignalyft.inventory.analytics
    Inventory analytics. Params: from (YYYY-MM-DD), to (YYYY-MM-DD)
  zignalyft.inventory.transactions
    Transaction history. Params: transaction_type (restock|sale|damaged|adjustment), item_id (number)

STAFF:
  zignalyft.staff.list
    All staff with roles. No params.

INSTRUCTORS:
  zignalyft.instructors.list
    Instructors with bio and specialty. No params.
  zignalyft.instructors.assigned
    Members assigned to an instructor. Params: instructorId (number, REQUIRED)

SHIFTS:
  zignalyft.shifts.list
    Staff shifts. Params: shift_type (opening|midday|closing|full), staff_id (number), from (YYYY-MM-DD), to (YYYY-MM-DD)
  zignalyft.shifts.analytics
    Shift coverage analytics. Params: from (YYYY-MM-DD), to (YYYY-MM-DD)

RETENTION:
  zignalyft.retention.analytics
    Overall retention analytics. Params: from (YYYY-MM-DD), to (YYYY-MM-DD), range (today|this_week|this_month|last_month|last_3_months)
  zignalyft.retention.churn
    Churn events (why members left). Params: churn_reason (cost|relocation|schedule|results|injury|service|other), from (YYYY-MM-DD), to (YYYY-MM-DD)
  zignalyft.retention.goals
    Member fitness goals. Params: status (active|achieved|abandoned)
  zignalyft.retention.assessments
    Fitness assessments (weight, BMI, body fat). Params: from (YYYY-MM-DD), to (YYYY-MM-DD)

═══════════════════════════════════════════════════════════════
RULES:
═══════════════════════════════════════════════════════════════
1. You are ONLY for ZignaLyft (gym). NEVER mention ZignaStay, hotels, or any other product.
2. You have READ-ONLY access. NEVER tell users you can create, update, or delete anything.
3. Use tools to fetch real data. NEVER fabricate numbers, names, or stats.
4. You MUST call tools using their EXACT names listed above. Do NOT invent tool names.
5. For dates, ALWAYS use the current year (${now.getFullYear()}). NEVER use ${now.getFullYear() - 1}.
6. Be concise and direct. No greetings, no "Hello! I'm Vigil" — just answer the question.
7. If a tool fails or you don't have the right tool, say "I don't have access to that data" — do NOT guess.
8. When comparing or analysing, fetch data from multiple tools and cross-reference the results.
9. If the user asks about "likely to churn" or "at risk", use retention.churn for historical patterns and retention.goals for engagement signals.
10. After fetching tool data, ALWAYS provide a natural language summary. Do NOT just list tool names or raw JSON. Explain the findings in plain English.

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

