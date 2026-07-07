import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PerguntaFitData } from "@/types/job";

interface SaveFitCulturalPayload {
  jobId: string;
  fit: {
    titulo: string;
    video_url: string | null;
    descricao: string | null;
    ativo: boolean;
  };
  perguntas: PerguntaFitData[];
}

export const useSaveFitCultural = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, fit, perguntas }: SaveFitCulturalPayload) => {
      // Upsert fit_cultural (unique on vaga_id)
      const { error: fitErr } = await (supabase as any)
        .from("fit_cultural")
        .upsert(
          {
            vaga_id: jobId,
            titulo: fit.titulo,
            video_url: fit.video_url,
            descricao: fit.descricao,
            ativo: fit.ativo,
          },
          { onConflict: "vaga_id" }
        );
      if (fitErr) throw fitErr;

      // Replace perguntas: delete existing, insert new
      const { error: delErr } = await (supabase as any)
        .from("perguntas_fit")
        .delete()
        .eq("vaga_id", jobId);
      if (delErr) throw delErr;

      if (perguntas.length > 0) {
        const rows = perguntas.map((p, idx) => ({
          vaga_id: jobId,
          texto: p.texto,
          tipo: p.tipo,
          opcoes: p.tipo === "multipla_escolha" ? p.opcoes : null,
          obrigatoria: p.obrigatoria,
          ordem: idx,
        }));
        const { error: insErr } = await (supabase as any)
          .from("perguntas_fit")
          .insert(rows);
        if (insErr) throw insErr;
      }
    },
    onSuccess: (_data, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ["fit-cultural", jobId] });
    },
  });
};