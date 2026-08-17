'use strict';

/**
 * Query complexity classifier for Vigil.
 * Analyses the user's message and returns the appropriate model tier.
 *
 * Tiers:
 *   high   — complex multi-step, cross-product, strategic, analytical
 *   medium — standard queries, single-tool, data lookup, explanations
 *   low    — greetings, yes/no, quick counts, simple lookups
 */

// ── Signal patterns ────────────────────────────────────────────────

const HIGH_SIGNALS = [
  // Cross-product / strategic
  /\b(compare|correlate|cross.?reference|across|both|all products)\b/i,
  /\b(strategy|strategic|recommend|suggest.*plan|action plan|roadmap)\b/i,
  /\b(analy[sz]e|analysis|insight|trend|pattern|forecast|predict)\b/i,
  /\b(report|summary|overview|breakdown|deep.?dive)\b/i,
  /\b(why|explain.*why|root cause|reason.*behind)\b/i,
  /\b(profit|revenue|growth|retention|churn|conversion|roi)\b/i,
  /\b(segment|cohort|group.*by|breakdown.*by|compare.*between)\b/i,
  // Multi-step orchestration
  /\b(step.?by.?step|walk.*through|guide.*through|full.*workflow)\b/i,
  /\b(create.*and.*then|do.*then.*also|first.*then|after.*that)\b/i,
  /\b(onboard|setup.*and.*configure|migrate.*to)\b/i,
];

const MEDIUM_SIGNALS = [
  // Single-tool / data lookup
  /\b(list|show|get|fetch|find|search|lookup|display)\b/i,
  /\b(how many|count|total|number of|statistics)\b/i,
  /\b(filter|sort|by status|by date|for today|this week|this month)\b/i,
  // Explanations
  /\b(explain|what is|what does|how does|how do|tell me about)\b/i,
  /\b(help.*with|assist.*with|guide.*on)\b/i,
  // Single actions
  /\b(add|create|update|delete|remove|cancel|confirm|book)\b/i,
  /\b(send|notify|message|email)\b/i,
];

const LOW_SIGNALS = [
  // Greetings / pleasantries
  /^(hi|hello|hey|yo|sup|thanks|thank you|ok|okay|sure|yes|no|yep|nope|bye|goodbye)/i,
  /\b(good morning|good afternoon|good evening|how are you)\b/i,
  // Simple identity / meta
  /\b(who are you|what are you|your name|what can you do)\b/i,
  // Very short queries (< 15 chars likely simple)
];

// ── Complexity scoring ─────────────────────────────────────────────

function countMatches(text, patterns) {
  return patterns.reduce((n, re) => n + (re.test(text) ? 1 : 0), 0);
}

/**
 * Classify a user message into a model tier.
 *
 * @param {string} message  — the user's input
 * @returns {{ tier: string, score: number, reason: string }}
 */
function classify(message) {
  if (!message || typeof message !== 'string') {
    return { tier: 'medium', score: 0, reason: 'empty or invalid message' };
  }

  const text = message.trim();
  const wordCount = text.split(/\s+/).length;

  // ── Low-tier fast path ──────────────────────────────────────────
  if (text.length < 15 || wordCount <= 3) {
    const lowHits = countMatches(text, LOW_SIGNALS);
    if (lowHits > 0) {
      return { tier: 'low', score: 0, reason: 'short greeting or simple keyword' };
    }
    // Short but not a greeting — likely a quick lookup
    return { tier: 'low', score: 0, reason: 'very short query' };
  }

  // ── Score each tier ─────────────────────────────────────────────
  const highScore = countMatches(text, HIGH_SIGNALS);
  const mediumScore = countMatches(text, MEDIUM_SIGNALS);
  const lowScore = countMatches(text, LOW_SIGNALS);

  // Complexity boosters
  const hasMultipleClauses = /[.,;]|\band\b|\bthen\b|\balso\b|\bwhile\b/i.test(text);
  const hasComparisons = /\bthan\b|\bvs\b|\bversus\b|\bcompared\b/i.test(text);
  const isLongQuery = wordCount > 30;

  let adjustedHigh = highScore;
  let adjustedMedium = mediumScore;

  if (hasMultipleClauses) adjustedHigh += 1;
  if (hasComparisons) adjustedHigh += 1;
  if (isLongQuery) adjustedHigh += 1;

  // ── Decision matrix ─────────────────────────────────────────────
  if (adjustedHigh >= 2) {
    return {
      tier: 'high',
      score: adjustedHigh,
      reason: `${adjustedHigh} high-complexity signals${hasMultipleClauses ? ' + multi-clause' : ''}${hasComparisons ? ' + comparison' : ''}${isLongQuery ? ' + long query' : ''}`,
    };
  }

  if (adjustedHigh >= 1 && adjustedMedium >= 1) {
    return {
      tier: 'high',
      score: adjustedHigh + adjustedMedium,
      reason: 'mixed high+medium signals',
    };
  }

  if (adjustedMedium >= 1) {
    return {
      tier: 'medium',
      score: adjustedMedium,
      reason: `${adjustedMedium} standard query signals`,
    };
  }

  // Default to medium for unclassified but non-trivial queries
  if (wordCount > 10) {
    return { tier: 'medium', score: 0, reason: 'non-trivial unclassified query' };
  }

  return { tier: 'low', score: 0, reason: 'short unclassified query' };
}

module.exports = { classify };
