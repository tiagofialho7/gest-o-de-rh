import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { JobStage } from "@/types/job";

interface SaveJobStagesInput {
  jobId: string;
  stages: JobStage[];
}

/**
 * Replaces all stages for a job: deletes existing rows and inserts the new ones.
 * Simple strategy keeps order & reorder logic trivial on the client.
 */
export const useSaveJobStages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, stages }: SaveJobStagesInput) => {
      const { error: delError } = await supabase
        .from("job_stages" as never)
        .delete()
        .eq("job_id", jobId);
      if (delError) throw delError;

      if (stages.length === 0) return [];

      const rows = stages.map((s, idx) => ({
        job_id: jobId,
        nome: s.nome,
        descricao: s.descricao || null,
        mensagem_email: s.mensagem_email || null,
        enviar_email: s.enviar_email,
        ordem: idx,
      }));

      const { data, error } = await supabase
        .from("job_stages" as never)
        .insert(rows as never)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ["job-stages", jobId] });
    },
  });
};