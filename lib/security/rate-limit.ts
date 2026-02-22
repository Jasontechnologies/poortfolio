export type RateLimitRule = {
  name: string;
  limit: number;
  windowMs: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type FailureBucket = {
  count: number;
  resetAt: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __jwotRateLimitStore: Map<string, RateLimitBucket> | undefined;
  // eslint-disable-next-line no-var
  var __jwotFailureStore: Map<string, FailureBucket> | undefined;
}

const rateStore = globalThis.__jwotRateLimitStore ?? new Map<string, RateLimitBucket>();
const failureStore = globalThis.__jwotFailureStore ?? new Map<string, FailureBucket>();

if (!globalThis.__jwotRateLimitStore) {
  globalThis.__jwotRateLimitStore = rateStore;
}

if (!globalThis.__jwotFailureStore) {
  globalThis.__jwotFailureStore = failureStore;
}

export type RateLimitCheck = {
  allowed: boolean;
  rule: RateLimitRule;
  remaining: number;
  retryAfterSeconds: number;
};

export function enforceRateLimit(key: string, rule: RateLimitRule): RateLimitCheck {
  const now = Date.now();
  const bucketKey = `${key}:${rule.name}`;
  const existing = rateStore.get(bucketKey);

  if (!existing || now >= existing.resetAt) {
    const resetAt = now + rule.windowMs;
    rateStore.set(bucketKey, { count: 1, resetAt });
    return {
      allowed: true,
      rule,
      remaining: Math.max(0, rule.limit - 1),
      retryAfterSeconds: Math.ceil(rule.windowMs / 1000)
    };
  }

  existing.count += 1;
  rateStore.set(bucketKey, existing);

  const allowed = existing.count <= rule.limit;
  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

  return {
    allowed,
    rule,
    remaining: Math.max(0, rule.limit - existing.count),
    retryAfterSeconds
  };
}

export function enforceRateLimits(key: string, rules: RateLimitRule[]): RateLimitCheck {
  let lastResult: RateLimitCheck | null = null;

  for (const rule of rules) {
    const result = enforceRateLimit(key, rule);
    lastResult = result;
    if (!result.allowed) return result;
  }

  if (!lastResult) {
    throw new Error('At least one rate limit rule is required.');
  }

  return lastResult;
}

export function recordFailure(key: string, windowMs: number) {
  const now = Date.now();
  const existing = failureStore.get(key);

  if (!existing || now >= existing.resetAt) {
    failureStore.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  existing.count += 1;
  failureStore.set(key, existing);
}

export function clearFailures(key: string) {
  failureStore.delete(key);
}

export function getFailureCount(key: string): number {
  const now = Date.now();
  const existing = failureStore.get(key);
  if (!existing) return 0;
  if (now >= existing.resetAt) {
    failureStore.delete(key);
    return 0;
  }
  return existing.count;
}
