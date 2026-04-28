import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useRegistrationSettings = () => {
  const [registrationEnabled, setRegistrationEnabled] = useState<boolean>(true);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase
      .from("system_settings")
      .select("id, registration_enabled")
      .limit(1)
      .single();

    if (data) {
      setSettingsId(data.id);
      setRegistrationEnabled(data.registration_enabled);
    } else {
      // No row exists — default to enabled
      setRegistrationEnabled(true);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const toggleRegistration = async (checked: boolean) => {
    setIsSaving(true);
    try {
      let error;
      if (settingsId) {
        const result = await supabase
          .from("system_settings")
          .update({ registration_enabled: checked })
          .eq("id", settingsId);
        error = result.error;
      } else {
        const result = await supabase
          .from("system_settings")
          .insert({ registration_enabled: checked })
          .select("id")
          .single();
        error = result.error;
        if (result.data) {
          setSettingsId(result.data.id);
        }
      }

      if (error) throw error;

      setRegistrationEnabled(checked);
      toast({
        title: checked ? "Registro habilitado" : "Registro desabilitado",
        description: checked
          ? "Novos usuários podem se registrar."
          : "Novos registros estão bloqueados.",
      });
    } catch (error) {
      console.error("Error toggling registration:", error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar a configuração.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    registrationEnabled,
    isLoading,
    isSaving,
    toggleRegistration,
  };
};
