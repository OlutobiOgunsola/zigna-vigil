'use strict';

const { getLogger } = require('../utils/logging');
const log = getLogger();

const DEFAULT_TTL_MS = 60_000; // 60 seconds

class ToolCache {
  constructor(ttlMs = DEFAULT_TTL_MS) {
    this.ttlMs = ttlMs;
    this.store = new Map();
    this.hits = 0;
    this.misses = 0;

    // Purge expired entries every 30s
    this._purgeInterval = setInterval(() => this._purge(), 30_000);
  }

  /**
   * Build a cache key from tool context.
   * Key = businessId:toolName:sortedArgsHash
   */
  _buildKey(businessId, toolName, args) {
    const sortedArgs = Object.keys(args || {})
      .sort()
      .reduce((acc, k) => {
        acc[k] = args[k];
        return acc;
      }, {});
    return `${businessId}:${toolName}:${JSON.stringify(sortedArgs)}`;
  }

  get(businessId, toolName, args) {
    const key = this._buildKey(businessId, toolName, args);
    const entry = this.store.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    log.debug('Cache hit', { key, age: Date.now() - entry.createdAt });
    return entry.data;
  }

  set(businessId, toolName, args, data) {
    const key = this._buildKey(businessId, toolName, args);
    this.store.set(key, {
      data,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  _purge() {
    const now = Date.now();
    let purged = 0;
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        purged++;
      }
    }
    if (purged > 0) {
      log.debug('Cache purge', { purged, remaining: this.store.size });
    }
  }

  stats() {
    return {
      size: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0
        ? ((this.hits / (this.hits + this.misses)) * 100).toFixed(1) + '%'
        : '0%',
    };
  }

  clear() {
    this.store.clear();
  }

  destroy() {
    clearInterval(this._purgeInterval);
    this.store.clear();
  }
}

// Singleton — shared across all tool calls
const toolCache = new ToolCache();

module.exports = toolCache;
module.exports.ToolCache = ToolCache;
