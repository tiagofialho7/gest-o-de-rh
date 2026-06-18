import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRequireOrganization } from "./useRequireOrganization";

export interface UnitRecord {
  id: string;
  name: string;
  address: string | null;
  city: string;
  state: string;
  country: string;
  is_active: boolean;
  created_at: string;
  organization_id: string | null;
}

/**
 * Returns ALL units (active and inactive) for the current organization.
 * Used by the Unidades admin page.
 */
export const useAllUnits = () => {
  const { organization } = useRequireOrganization();

  return useQuery({
    queryKey: ["units", "all", organization?.id],
    queryFn: async (): Promise<UnitRecord[]> => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("units")
        .select("*")
        .eq("organization_id", organization.id)
        .order("name");

      if (error) throw error;
      return (data as UnitRecord[]) ?? [];
    },
    enabled: !!organization?.id,
  });
};