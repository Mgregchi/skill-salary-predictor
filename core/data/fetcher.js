// core/data/fetcher.js
// Shared data fetcher with global cache, TTL, timeout, and validation

const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes
const DEFAULT_TIMEOUT_MS = 3000;

// Global cache keyed by cacheKey (explicit) or loader reference string
const cache = new Map();

const requiredKeys = ["baseSalaries", "skills", "experience", "combos", "currencies"];

function validatePayload(payload) {
  if (!payload || typeof payload !== "object") return false;
  return requiredKeys.every((key) => Object.prototype.hasOwnProperty.call(payload, key));
}

function withTimeout(promise, timeoutMs) {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("Data load timeout")), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(id);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(id);
        reject(err);
      });
  });
}

/**
 * Load data with caching, TTL, and optional stale-if-error fallback.
 * @param {Object} opts
 * @param {Function} opts.loader - async function returning data payload
 * @param {string} [opts.cacheKey] - optional cache key; defaults to loader.toString hash
 * @param {number} [opts.ttlMs]
 * @param {number} [opts.timeoutMs]
 * @param {boolean} [opts.allowStale=true] - serve stale data on refresh failure
 * @param {Function} [opts.onWarning] - warning callback(message, context)
 */
async function loadData(opts) {
  const {
    loader,
    cacheKey,
    ttlMs = DEFAULT_TTL_MS,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    allowStale = true,
    onWarning,
  } = opts;

  if (typeof loader !== "function") {
    throw new Error("loader must be a function");
  }

  const key = cacheKey || loader.toString();
  const now = Date.now();
  const cached = cache.get(key);
  const isExpired = cached ? now - cached.fetchedAt > ttlMs : true;

  // Serve fresh cache if valid and not expired
  if (cached && !isExpired) {
    return { data: cached.data, source: "cache", stale: false, fetchedAt: cached.fetchedAt };
  }

  // Attempt refresh (with timeout)
  try {
    const payload = await withTimeout(Promise.resolve(loader()), timeoutMs);
    if (!validatePayload(payload)) {
      throw new Error("Invalid data payload");
    }
    const record = { data: payload, fetchedAt: Date.now() };
    cache.set(key, record);
    return { data: payload, source: "live", stale: false, fetchedAt: record.fetchedAt };
  } catch (error) {
    // Use stale if allowed and available
    if (cached && allowStale) {
      if (onWarning) {
        onWarning("Using stale data due to load failure", { error: error.message });
      }
      return { data: cached.data, source: "stale-cache", stale: true, fetchedAt: cached.fetchedAt };
    }
    throw error;
  }
}

module.exports = {
  loadData,
  validatePayload,
  cache,
  DEFAULT_TTL_MS,
  DEFAULT_TIMEOUT_MS,
};
