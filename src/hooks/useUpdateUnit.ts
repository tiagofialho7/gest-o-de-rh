import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UpdateUnitInput {
  id: string;
  name?: string;
  address?: string | null;
  city?: string;
  state?: string;
  is_active?: boolean;
}

export const useUpdateUnit = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...patch }: UpdateUnitInput) => {
      const { data, error } = await supabase
        .from("units")
        .update(patch)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      toast({
        title: "Unidade atualizada",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar unidade",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};