const PUBLIC_ENV_ERROR_PREFIX = '[env] Missing required public environment variable';
const SERVER_ENV_ERROR_PREFIX = '[env] Missing required server environment variable';

type ServerEnvName =
  | 'TURNSTILE_SECRET_KEY'
  | 'SUPABASE_SERVICE_ROLE_KEY'
  | 'OPENAI_API_KEY'
  | 'STRIPE_SECRET_KEY';

function requiredPublic(name: 'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${PUBLIC_ENV_ERROR_PREFIX} ${name}. Add it to your environment (local or Vercel).`
    );
  }
  return value;
}

export function getPublicSupabaseEnv() {
  const supabaseUrl = requiredPublic('NEXT_PUBLIC_SUPABASE_URL');

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseAnonKey) {
    throw new Error(
      `${PUBLIC_ENV_ERROR_PREFIX} NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).`
    );
  }

  return {
    supabaseUrl,
    supabaseAnonKey
  };
}

export function requireServerEnv(name: ServerEnvName) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${SERVER_ENV_ERROR_PREFIX} ${name}. Set it in server environment settings before using this route.`
    );
  }
  return value;
}
