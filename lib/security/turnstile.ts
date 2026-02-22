import { requireServerEnv } from '@/lib/env';

type TurnstileVerificationResult = {
  success: boolean;
  errorCodes: string[];
};

export async function verifyTurnstileToken({
  token,
  remoteIp
}: {
  token: string;
  remoteIp: string;
}): Promise<TurnstileVerificationResult> {
  const secret = requireServerEnv('TURNSTILE_SECRET_KEY');

  const body = new URLSearchParams({
    secret,
    response: token,
    remoteip: remoteIp
  });

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString(),
    cache: 'no-store'
  });

  if (!response.ok) {
    return {
      success: false,
      errorCodes: ['verification-unavailable']
    };
  }

  const payload = (await response.json()) as {
    success?: boolean;
    ['error-codes']?: string[];
  };

  return {
    success: Boolean(payload.success),
    errorCodes: payload['error-codes'] ?? []
  };
}
