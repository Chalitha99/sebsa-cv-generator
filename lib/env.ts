import { z } from 'zod';

const emptyToUndefined = (val: unknown) => (val === '' ? undefined : val);

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  SUPABASE_SERVICE_ROLE_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  AI_PROVIDER: z.preprocess(emptyToUndefined, z.enum(['gemini', 'claude']).default('gemini')),
  GEMINI_API_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  CLAUDE_API_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  // Absolute origin used to build the invite-email redirect link (app/(authenticated)/upload/actions.ts
  // -> lib/auth/provisionAccount.ts) since Server Actions have no reliable window.location. Must
  // also be added to Supabase Dashboard -> Authentication -> URL Configuration -> Redirect URLs
  // as `${NEXT_PUBLIC_APP_URL}/auth/callback`, or Supabase will reject the invite redirect.
  NEXT_PUBLIC_APP_URL: z.preprocess(emptyToUndefined, z.string().url().default('http://localhost:3000')),
});

/**
 * Parsed once at import time. Individual fields may legitimately be undefined this early in the
 * migration (e.g. no Supabase project yet) — callers that actually need a value must go through
 * `requireEnv` so the failure surfaces at the point of use, not on every page load.
 */
export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  AI_PROVIDER: process.env.AI_PROVIDER,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

export function requireEnv<K extends keyof typeof env>(key: K): NonNullable<(typeof env)[K]> {
  const value = env[key];
  if (value === undefined || value === '') {
    throw new Error(
      `Missing required environment variable: ${key}. Set it in .env.local (see .env.local.example).`
    );
  }
  return value as NonNullable<(typeof env)[K]>;
}
