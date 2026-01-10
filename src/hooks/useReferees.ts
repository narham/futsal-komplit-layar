import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Referee {
  id: string;
  full_name: string;
  birth_date: string | null;
  kabupaten_kota_id: string | null;
  kabupaten_kota_name: string | null;
  license_level: string | null;
  license_expiry: string | null;
  profile_photo_url: string | null;
  is_active: boolean;
  is_profile_complete: boolean;
  afk_origin: string | null;
  created_at: string;
}

export interface RefereeFilters {
  licenseLevel?: string;
  isActive?: boolean;
  kabupatenKotaId?: string;
  search?: string;
}

export function useReferees(filters?: RefereeFilters) {
  return useQuery({
    queryKey: ["referees", filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_referees", {
        _license_level: filters?.licenseLevel || null,
        _is_active: filters?.isActive ?? null,
        _kabupaten_kota_id: filters?.kabupatenKotaId || null,
        _search: filters?.search || null,
      });

      if (error) throw error;
      return data as Referee[];
    },
  });
}

export function useReferee(id: string) {
  return useQuery({
    queryKey: ["referees", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          kabupaten_kota:kabupaten_kota_id (id, name)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) return null;

      // Check if user has wasit role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", id)
        .eq("role", "wasit")
        .maybeSingle();

      if (!roleData) return null;

      return {
        ...data,
        kabupaten_kota_name: data.kabupaten_kota?.name || null,
      };
    },
    enabled: !!id,
  });
}

export function useRefereeStats() {
  return useQuery({
    queryKey: ["referee-stats"],
    queryFn: async () => {
      // Get all referees
      const { data: referees, error } = await supabase.rpc("get_referees", {
        _license_level: null,
        _is_active: null,
        _kabupaten_kota_id: null,
        _search: null,
      });

      if (error) throw error;

      const total = referees?.length || 0;
      const active = referees?.filter((r: Referee) => r.is_active).length || 0;
      const inactive = total - active;

      // Count by license
      const level1 = referees?.filter((r: Referee) => r.license_level === "Level 1").length || 0;
      const level2 = referees?.filter((r: Referee) => r.license_level === "Level 2").length || 0;
      const level3 = referees?.filter((r: Referee) => r.license_level === "Level 3").length || 0;

      return {
        total,
        active,
        inactive,
        level1,
        level2,
        level3,
      };
    },
  });
}

export function useUpdateReferee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      full_name?: string;
      birth_date?: string;
      kabupaten_kota_id?: string;
      license_level?: string;
      license_expiry?: string;
      afk_origin?: string;
      occupation?: string;
      is_active?: boolean;
    }) => {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["referees"] });
      queryClient.invalidateQueries({ queryKey: ["referees", data.id] });
      queryClient.invalidateQueries({ queryKey: ["referee-stats"] });
      toast.success("Data wasit berhasil diperbarui");
    },
    onError: (error) => {
      toast.error("Gagal memperbarui data wasit: " + error.message);
    },
  });
}

export function useToggleRefereeStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from("profiles")
        .update({ is_active: isActive })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["referees"] });
      queryClient.invalidateQueries({ queryKey: ["referees", data.id] });
      queryClient.invalidateQueries({ queryKey: ["referee-stats"] });
      toast.success(variables.isActive ? "Wasit diaktifkan" : "Wasit dinonaktifkan");
    },
    onError: (error) => {
      toast.error("Gagal mengubah status wasit: " + error.message);
    },
  });
}

// License level options
export const LICENSE_LEVELS = [
  { value: "Level 1", label: "Level 1" },
  { value: "Level 2", label: "Level 2" },
  { value: "Level 3", label: "Level 3" },
];

export function getLicenseBadgeColor(level: string | null) {
  switch (level) {
    case "Level 1":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "Level 2":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Level 3":
      return "bg-green-100 text-green-800 border-green-200";    
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}
