import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { getCurrentOrganizationId, supabaseForUser } from "./_supabase";

export default defineTool({
  name: "list_employees",
  title: "List employees",
  description:
    "List employees of the current user's organization. Optionally filter by name (case-insensitive substring).",
  inputSchema: {
    search: z.string().optional().describe("Optional name substring to filter by."),
    limit: z.number().int().optional().describe("Max rows (default 50, max 200)."),
  },
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    openWorldHint: false,
  },
  handler: async ({ search, limit }, ctx) => {
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
    const cap = Math.min(Math.max(limit ?? 50, 1), 200);
    let q = sb
      .from("employees")
      .select("id, full_name, email, status, position_id, department_id, created_at")
      .eq("organization_id", orgId)
      .order("full_name", { ascending: true })
      .limit(cap);
    if (search) q = q.ilike("full_name", `%${search}%`);
    const { data, error } = await q;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { employees: data ?? [] },
    };
  },
});