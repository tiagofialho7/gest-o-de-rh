import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PerguntaFitData } from "@/types/job";

export interface FitCulturalRecord {
  id: string;
  vaga_id: string;
  titulo: string;
  video_url: string | null;
  descricao: string | null;
  ativo: boolean;
}

export const useFitCultural = (jobId: string | undefined) => {
  return useQuery({
    queryKey: ["fit-cultural", jobId],
    queryFn: async () => {
      if (!jobId) return { fit: null, perguntas: [] as PerguntaFitData[] };

      const [fitRes, perguntasRes] = await Promise.all([
        (supabase as any)
          .from("fit_cultural")
          .select("*")
          .eq("vaga_id", jobId)
          .maybeSingle(),
        (supabase as any)
          .from("perguntas_fit")
          .select("*")
          .eq("vaga_id", jobId)
          .order("ordem", { ascending: true }),
      ]);

      if (fitRes.error) throw fitRes.error;
      if (perguntasRes.error) throw perguntasRes.error;

      const perguntas: PerguntaFitData[] = (perguntasRes.data || []).map(
        (p: any) => ({
          id: p.id,
          vaga_id: p.vaga_id,
          texto: p.texto,
          tipo: p.tipo,
          opcoes: Array.isArray(p.opcoes) ? p.opcoes : [],
          obrigatoria: p.obrigatoria,
          ordem: p.ordem,
        })
      );

      return {
        fit: (fitRes.data as FitCulturalRecord | null) || null,
        perguntas,
      };
    },
    enabled: !!jobId,
  });
};