import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "./_supabase";

export default defineTool({
  name: "list_candidates",
  title: "List candidates for a job",
  description:
    "List candidates (job applications) for a given job ID. Returns candidate name, email, current stage and application date.",
  inputSchema: {
    job_id: z.string().uuid().describe("The job (vaga) UUID to list candidates for."),
    limit: z.number().int().optional().describe("Max rows (default 50, max 200)."),
  },
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    openWorldHint: false,
  },
  handler: async ({ job_id, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    const cap = Math.min(Math.max(limit ?? 50, 1), 200);
    const { data, error } = await sb
      .from("job_applications")
      .select("id, candidate_name, candidate_email, stage_id, created_at, status")
      .eq("job_id", job_id)
      .order("created_at", { ascending: false })
      .limit(cap);
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { candidates: data ?? [] },
    };
  },
});