import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { getCurrentOrganizationId, supabaseForUser } from "./_supabase";

export default defineTool({
  name: "list_jobs",
  title: "List jobs",
  description:
    "List the current user's organization jobs (vagas). Returns id, title, status and creation date. Respects the user's access via RLS.",
  inputSchema: {
    status: z
      .string()
      .optional()
      .describe("Optional status filter, e.g. 'open', 'closed'."),
    limit: z
      .number()
      .int()
      .optional()
      .describe("Maximum rows to return (default 20, max 100)."),
  },
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    openWorldHint: false,
  },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    const orgId = await getCurrentOrganizationId(sb, ctx.getUserId()!);
    if (!orgId) {
      return {
        content: [{ type: "text", text: "No organization found for this user." }],
        isError: true,
      };
    }
    const cap = Math.min(Math.max(limit ?? 20, 1), 100);
    let q = sb
      .from("jobs")
      .select("id, title, status, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(cap);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { jobs: data ?? [] },
    };
  },
});