'use strict';

/**
 * Tiered model registry for Vigil AI provider.
 * Models are grouped by intelligence level for query-based routing.
 * All models are free on OpenCode Zen ($0.00 input/output).
 *
 * Verified available models (2026-08-17):
 *   Free: hy3-free, nemotron-3-ultra-free, nemotron-3.5-lightning-free, big-pickle, deepseek-v4-flash-free, mimo-v2.5-free
 *
 * Tier 1 (high)   — complex multi-step analysis, cross-product insights
 * Tier 2 (medium) — standard queries, single-tool requests, data lookups
 * Tier 3 (low)    — simple questions, greetings, basic yes/no
 */

const MODEL_TIERS = {
  high: {
    label: 'High Intelligence',
    description: 'Complex reasoning, multi-tool orchestration, cross-product analysis',
    models: [
      {
        id: 'hy3-free',
        name: 'Hy3',
        contextWindow: 190000,
        maxOutput: 64000,
        reasoning: true,
        priority: 1,
      },
      {
        id: 'deepseek-v4-flash-free',
        name: 'DeepSeek V4 Flash',
        contextWindow: 200000,
        maxOutput: 128000,
        reasoning: true,
        priority: 2,
      },
      {
        id: 'nemotron-3-ultra-free',
        name: 'Nemotron 3 Ultra',
        contextWindow: 1000000,
        maxOutput: 128000,
        reasoning: true,
        priority: 3,
      },
    ],
  },

  medium: {
    label: 'Medium Intelligence',
    description: 'Standard queries, single-tool requests, data lookups, explanations',
    models: [
      {
        id: 'hy3-free',
        name: 'Hy3',
        contextWindow: 190000,
        maxOutput: 64000,
        reasoning: true,
        priority: 1,
      },
      {
        id: 'mimo-v2.5-free',
        name: 'MiMo V2.5',
        contextWindow: 200000,
        maxOutput: 32000,
        reasoning: true,
        priority: 2,
      },
      {
        id: 'nemotron-3.5-lightning-free',
        name: 'Nemotron 3.5 Lightning',
        contextWindow: 200000,
        maxOutput: 64000,
        reasoning: true,
        priority: 3,
      },
    ],
  },

  low: {
    label: 'Low Intelligence',
    description: 'Simple questions, greetings, yes/no, quick counts, basic lookups',
    models: [
      {
        id: 'hy3-free',
        name: 'Hy3',
        contextWindow: 190000,
        maxOutput: 64000,
        reasoning: true,
        priority: 1,
      },
      {
        id: 'big-pickle',
        name: 'Big Pickle',
        contextWindow: 200000,
        maxOutput: 32000,
        reasoning: true,
        priority: 2,
      },
      {
        id: 'nemotron-3.5-lightning-free',
        name: 'Nemotron 3.5 Lightning',
        contextWindow: 200000,
        maxOutput: 64000,
        reasoning: true,
        priority: 3,
      },
    ],
  },
};

/**
 * Get the default model for a given tier.
 * Returns the highest-priority (lowest priority number) model.
 */
function getDefaultModel(tier) {
  const t = MODEL_TIERS[tier];
  if (!t) return null;
  return t.models.sort((a, b) => a.priority - b.priority)[0];
}

/**
 * Get a fallback model from a higher tier if the preferred tier fails.
 * Returns the next tier's default model.
 */
function getFallbackModel(failedTier) {
  const fallbackOrder = { high: 'medium', medium: 'low', low: null };
  const fallbackTier = fallbackOrder[failedTier];
  if (!fallbackTier) return null;
  return getDefaultModel(fallbackTier);
}

/**
 * List all model IDs across all tiers.
 */
function getAllModelIds() {
  return Object.values(MODEL_TIERS).flatMap((tier) =>
    tier.models.map((m) => m.id)
  );
}

module.exports = {
  MODEL_TIERS,
  getDefaultModel,
  getFallbackModel,
  getAllModelIds,
};
