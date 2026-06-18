import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { JobStage } from "@/types/job";

export const useJobStages = (jobId: string | undefined) => {
  return useQuery({
    queryKey: ["job-stages", jobId],
    queryFn: async (): Promise<JobStage[]> => {
      if (!jobId) return [];
      const { data, error } = await supabase
        .from("job_stages" as never)
        .select("*")
        .eq("job_id", jobId)
        .order("ordem", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as JobStage[];
    },
    enabled: !!jobId,
  });
};