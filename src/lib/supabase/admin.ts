import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Server-only privileged Supabase client.
 * Strictly used for server-side evaluation (e.g. grading against server-held answer keys)
 * and setup operations. Never exposed to browser or client bundles.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    '';

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing Supabase configuration in server environment.');
  }

  return createSupabaseClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
