import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface JobFitCandidateResponse {
  application_id: string;
  candidate_name: string;
  candidate_email: string;
  submitted_at: string;
  answers: {
    pergunta_id: string;
    texto: string;
    tipo: string;
    ordem: number;
    resposta: string | null;
  }[];
}

export const useJobFitResponses = (jobId?: string) => {
  return useQuery({
    queryKey: ["job-fit-responses", jobId],
    enabled: !!jobId,
    queryFn: async (): Promise<JobFitCandidateResponse[]> => {
      if (!jobId) return [];

      const { data: perguntas } = await supabase
        .from("perguntas_fit")
        .select("id, texto, tipo, ordem")
        .eq("vaga_id", jobId)
        .order("ordem", { ascending: true });

      const { data: respostas, error } = await supabase
        .from("respostas_fit")
        .select("candidato_id, pergunta_id, resposta, created_at")
        .eq("vaga_id", jobId);
      if (error) throw error;
      if (!respostas || respostas.length === 0) return [];

      const appIds = Array.from(new Set(respostas.map((r) => r.candidato_id)));
      const { data: apps } = await supabase
        .from("job_applications")
        .select("id, candidate_name, candidate_email")
        .in("id", appIds);

      return (apps ?? []).map((a) => {
        const rs = respostas.filter((r) => r.candidato_id === a.id);
        const submitted_at =
          rs.map((r) => r.created_at).sort().slice(-1)[0] ?? "";
        return {
          application_id: a.id,
          candidate_name: a.candidate_name,
          candidate_email: a.candidate_email,
          submitted_at,
          answers: (perguntas ?? []).map((p) => ({
            pergunta_id: p.id,
            texto: p.texto,
            tipo: p.tipo,
            ordem: p.ordem,
            resposta: rs.find((r) => r.pergunta_id === p.id)?.resposta ?? null,
          })),
        };
      }).sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
    },
  });
};