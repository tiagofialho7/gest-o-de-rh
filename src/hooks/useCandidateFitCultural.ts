import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FitPerguntaResposta {
  pergunta_id: string;
  texto: string;
  tipo: string;
  ordem: number;
  resposta: string | null;
}

export interface FitCulturalByJob {
  application_id: string;
  job_id: string;
  job_title: string;
  fit_titulo: string | null;
  video_url: string | null;
  submitted_at: string | null;
  status: "respondido" | "aguardando" | "sem_acesso";
  token: string | null;
  expires_at: string | null;
  perguntas: FitPerguntaResposta[];
}

/**
 * Loads all Fit Cultural data for a candidate (by email), grouped by job.
 * Uses email so we aggregate across multiple job applications of the same person.
 */
export const useCandidateFitCultural = (candidateEmail?: string | null) => {
  return useQuery({
    queryKey: ["candidate-fit-cultural", candidateEmail],
    enabled: !!candidateEmail,
    queryFn: async (): Promise<FitCulturalByJob[]> => {
      if (!candidateEmail) return [];

      // 1. All applications for this email
      const { data: apps, error: appsErr } = await supabase
        .from("job_applications")
        .select("id, job_id, jobs:job_id(title)")
        .eq("candidate_email", candidateEmail);
      if (appsErr) throw appsErr;
      if (!apps || apps.length === 0) return [];

      const appIds = apps.map((a) => a.id);
      const jobIds = Array.from(new Set(apps.map((a) => a.job_id)));

      // 2. Fit config per vaga
      const { data: fits } = await supabase
        .from("fit_cultural")
        .select("vaga_id, titulo, video_url")
        .in("vaga_id", jobIds);

      // 3. Questions per vaga
      const { data: perguntas } = await supabase
        .from("perguntas_fit")
        .select("id, vaga_id, texto, tipo, ordem")
        .in("vaga_id", jobIds)
        .order("ordem", { ascending: true });

      // 4. Responses for these applications
      const { data: respostas } = await supabase
        .from("respostas_fit")
        .select("candidato_id, vaga_id, pergunta_id, resposta, created_at")
        .in("candidato_id", appIds);

      // 5. Access tokens
      const { data: acessos } = await supabase
        .from("acessos_fit")
        .select("candidato_id, vaga_id, token, usado, expires_at, created_at")
        .in("candidato_id", appIds)
        .order("created_at", { ascending: false });

      const result: FitCulturalByJob[] = [];

      for (const app of apps) {
        const jobPerguntas = (perguntas ?? []).filter((p) => p.vaga_id === app.job_id);
        const appRespostas = (respostas ?? []).filter(
          (r) => r.candidato_id === app.id && r.vaga_id === app.job_id
        );
        const appAcesso = (acessos ?? []).find(
          (a) => a.candidato_id === app.id && a.vaga_id === app.job_id
        );
        const fit = (fits ?? []).find((f) => f.vaga_id === app.job_id);

        // Skip jobs that have no fit config AND no access/response — nothing to show
        if (!fit && appRespostas.length === 0 && !appAcesso) continue;

        const hasResponses = appRespostas.length > 0;
        const status: FitCulturalByJob["status"] = hasResponses
          ? "respondido"
          : appAcesso
            ? "aguardando"
            : "sem_acesso";

        const submitted_at = hasResponses
          ? appRespostas
              .map((r) => r.created_at)
              .sort()
              .slice(-1)[0] ?? null
          : null;

        result.push({
          application_id: app.id,
          job_id: app.job_id,
          job_title: (app.jobs as any)?.title ?? "Vaga",
          fit_titulo: fit?.titulo ?? null,
          video_url: fit?.video_url ?? null,
          submitted_at,
          status,
          token: appAcesso?.token ?? null,
          expires_at: appAcesso?.expires_at ?? null,
          perguntas: jobPerguntas.map((p) => ({
            pergunta_id: p.id,
            texto: p.texto,
            tipo: p.tipo,
            ordem: p.ordem,
            resposta:
              appRespostas.find((r) => r.pergunta_id === p.id)?.resposta ?? null,
          })),
        });
      }

      return result;
    },
  });
};