import type { SupabaseClient } from '@supabase/supabase-js';

export type DbRateLimitResult = {
  allowed: boolean;
  currentCount: number;
  remaining: number;
  retryAfterSeconds: number;
};

type CheckRateLimitRow = {
  allowed: boolean;
  current_count: number;
  remaining: number;
  retry_after_seconds: number;
};

async function callRateLimitRpc({
  supabase,
  rateKey,
  bucket,
  limit,
  windowSeconds,
  increment,
  reset
}: {
  supabase: SupabaseClient;
  rateKey: string;
  bucket: string;
  limit: number;
  windowSeconds: number;
  increment: number;
  reset: boolean;
}): Promise<DbRateLimitResult> {
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_rate_key: rateKey,
    p_bucket: bucket,
    p_limit: limit,
    p_window_seconds: windowSeconds,
    p_increment: increment,
    p_reset: reset
  });

  if (error) {
    throw new Error(`Rate limit RPC failed: ${error.message}`);
  }

  const row = (Array.isArray(data) ? data[0] : data) as CheckRateLimitRow | null;
  if (!row) {
    throw new Error('Rate limit RPC returned no rows.');
  }

  return {
    allowed: Boolean(row.allowed),
    currentCount: Number(row.current_count ?? 0),
    remaining: Number(row.remaining ?? 0),
    retryAfterSeconds: Number(row.retry_after_seconds ?? 0)
  };
}

export async function consumeDbRateLimit({
  supabase,
  rateKey,
  bucket,
  limit,
  windowSeconds
}: {
  supabase: SupabaseClient;
  rateKey: string;
  bucket: string;
  limit: number;
  windowSeconds: number;
}) {
  return callRateLimitRpc({
    supabase,
    rateKey,
    bucket,
    limit,
    windowSeconds,
    increment: 1,
    reset: false
  });
}

export async function peekDbRateLimit({
  supabase,
  rateKey,
  bucket,
  limit,
  windowSeconds
}: {
  supabase: SupabaseClient;
  rateKey: string;
  bucket: string;
  limit: number;
  windowSeconds: number;
}) {
  return callRateLimitRpc({
    supabase,
    rateKey,
    bucket,
    limit,
    windowSeconds,
    increment: 0,
    reset: false
  });
}

export async function resetDbRateLimit({
  supabase,
  rateKey,
  bucket,
  limit,
  windowSeconds
}: {
  supabase: SupabaseClient;
  rateKey: string;
  bucket: string;
  limit: number;
  windowSeconds: number;
}) {
  return callRateLimitRpc({
    supabase,
    rateKey,
    bucket,
    limit,
    windowSeconds,
    increment: 0,
    reset: true
  });
}
