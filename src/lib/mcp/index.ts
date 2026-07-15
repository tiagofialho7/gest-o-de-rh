import { auth, defineMcp } from "@lovable.dev/mcp-js";
import whoamiTool from "./tools/whoami";
import listJobsTool from "./tools/list-jobs";
import listCandidatesTool from "./tools/list-candidates";
import listEmployeesTool from "./tools/list-employees";

// The OAuth issuer MUST be the direct Supabase host built from the project ref.
// VITE_SUPABASE_PROJECT_ID is inlined at build time, keeping this entry
// import-safe (no runtime env read at module top level).
const projectRef =
  import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "pwr-hr-mcp",
  title: "PWR Gestão HR",
  version: "0.1.0",
  instructions:
    "Ferramentas do PWR Gestão (RH). Cada chamada roda como o usuário autenticado e respeita as permissões (RLS) da organização. Use `whoami` para confirmar a conexão; `list_jobs`, `list_candidates` e `list_employees` para consultar dados da organização atual do usuário.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [whoamiTool, listJobsTool, listCandidatesTool, listEmployeesTool],
});