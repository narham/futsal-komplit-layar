import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface SystemSetting {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useSystemSettings() {
  return useQuery({
    queryKey: ["system-settings"],
    queryFn: async (): Promise<SystemSetting[]> => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .order("key");

      if (error) throw error;
      return data || [];
    },
  });
}

export function useSettingByKey(key: string) {
  return useQuery({
    queryKey: ["system-settings", key],
    queryFn: async (): Promise<SystemSetting | null> => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .eq("key", key)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { data, error } = await supabase
        .from("system_settings")
        .update({ 
          value, 
          updated_by: user?.id 
        })
        .eq("key", key)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      toast.success("Pengaturan berhasil disimpan");
    },
    onError: (error) => {
      console.error("Error updating setting:", error);
      toast.error("Gagal menyimpan pengaturan");
    },
  });
}

export function useBulkUpdateSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (settings: { key: string; value: string }[]) => {
      const updates = settings.map(({ key, value }) =>
        supabase
          .from("system_settings")
          .update({ value, updated_by: user?.id })
          .eq("key", key)
      );

      const results = await Promise.all(updates);
      const errors = results.filter((r) => r.error);
      
      if (errors.length > 0) {
        throw new Error("Some settings failed to update");
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      toast.success("Semua pengaturan berhasil disimpan");
    },
    onError: (error) => {
      console.error("Error updating settings:", error);
      toast.error("Gagal menyimpan pengaturan");
    },
  });
}

// Helper to get settings as a key-value map
export function useSettingsMap() {
  const { data: settings, ...rest } = useSystemSettings();
  
  const settingsMap = settings?.reduce((acc, setting) => {
    acc[setting.key] = setting.value || "";
    return acc;
  }, {} as Record<string, string>) || {};

  return { settingsMap, ...rest };
}
