import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

/**
 * Build a Supabase client scoped to the MCP caller. The verified access token
 * from the OAuth bearer is forwarded so all queries run under the user's
 * identity and RLS policies apply as that user. Never uses the service role.
 */
export function supabaseForUser(ctx: ToolContext): SupabaseClient {
  const url = process.env.SUPABASE_URL!;
  const anon = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient(url, anon, {
    global: {
      headers: { Authorization: `Bearer ${ctx.getToken()}` },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Return the first organization ID this user belongs to, or null. */
export async function getCurrentOrganizationId(
  sb: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data, error } = await sb
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return (data as { organization_id: string }).organization_id;
}