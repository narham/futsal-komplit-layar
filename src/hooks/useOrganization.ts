import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Types
export interface Provinsi {
  id: string;
  name: string;
  code: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface KabupatenKota {
  id: string;
  name: string;
  code: string | null;
  provinsi_id: string | null;
  provinsi?: Provinsi | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Pengurus {
  id: string;
  user_id: string;
  level: "PROVINSI" | "KAB_KOTA";
  jabatan: string;
  provinsi_id: string | null;
  kabupaten_kota_id: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  // Joined data
  profile?: {
    id: string;
    full_name: string;
    profile_photo_url: string | null;
  };
  provinsi?: Provinsi | null;
  kabupaten_kota?: KabupatenKota | null;
}

// Provinsi hooks
export function useProvinsiList() {
  return useQuery({
    queryKey: ["provinsi"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provinsi")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Provinsi[];
    },
  });
}

export function useCreateProvinsi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; code?: string }) => {
      const { data: result, error } = await supabase
        .from("provinsi")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provinsi"] });
    },
  });
}

export function useUpdateProvinsi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name: string; code?: string }) => {
      const { data: result, error } = await supabase
        .from("provinsi")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provinsi"] });
    },
  });
}

export function useDeleteProvinsi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("provinsi").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provinsi"] });
      queryClient.invalidateQueries({ queryKey: ["kabupaten-kota"] });
    },
  });
}

// Kabupaten/Kota hooks with provinsi relation
export function useKabupatenKotaList(provinsiId?: string) {
  return useQuery({
    queryKey: ["kabupaten-kota", provinsiId],
    queryFn: async () => {
      let query = supabase
        .from("kabupaten_kota")
        .select(`
          *,
          provinsi:provinsi_id (*)
        `)
        .order("name");

      if (provinsiId) {
        query = query.eq("provinsi_id", provinsiId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as KabupatenKota[];
    },
  });
}

export function useCreateKabupatenKota() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; code?: string; provinsi_id?: string }) => {
      const { data: result, error } = await supabase
        .from("kabupaten_kota")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kabupaten-kota"] });
    },
  });
}

export function useUpdateKabupatenKota() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name: string; code?: string; provinsi_id?: string }) => {
      const { data: result, error } = await supabase
        .from("kabupaten_kota")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kabupaten-kota"] });
    },
  });
}

export function useDeleteKabupatenKota() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("kabupaten_kota").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kabupaten-kota"] });
    },
  });
}

// Pengurus hooks
export function usePengurusList(filters?: { level?: "PROVINSI" | "KAB_KOTA"; provinsiId?: string; kabupatenKotaId?: string }) {
  return useQuery({
    queryKey: ["pengurus", filters],
    queryFn: async () => {
      let query = supabase
        .from("pengurus")
        .select(`
          *,
          provinsi:provinsi_id (*),
          kabupaten_kota:kabupaten_kota_id (*)
        `)
        .order("created_at", { ascending: false });

      if (filters?.level) {
        query = query.eq("level", filters.level);
      }
      if (filters?.provinsiId) {
        query = query.eq("provinsi_id", filters.provinsiId);
      }
      if (filters?.kabupatenKotaId) {
        query = query.eq("kabupaten_kota_id", filters.kabupatenKotaId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch profile data for each pengurus
      const userIds = data.map((p) => p.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, profile_photo_url")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      return data.map((p) => ({
        ...p,
        profile: profileMap.get(p.user_id) || null,
      })) as Pengurus[];
    },
  });
}

export function useCreatePengurus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      user_id: string;
      level: "PROVINSI" | "KAB_KOTA";
      jabatan: string;
      provinsi_id?: string;
      kabupaten_kota_id?: string;
    }) => {
      const { data: result, error } = await supabase
        .from("pengurus")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pengurus"] });
    },
  });
}

export function useUpdatePengurus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: {
      id: string;
      jabatan?: string;
      is_active?: boolean;
    }) => {
      const { data: result, error } = await supabase
        .from("pengurus")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pengurus"] });
    },
  });
}

export function useDeletePengurus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pengurus").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pengurus"] });
    },
  });
}

// Get users that can be assigned as pengurus
export function useAvailableUsersForPengurus() {
  return useQuery({
    queryKey: ["available-users-pengurus"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, profile_photo_url")
        .order("full_name");

      if (error) throw error;
      return data;
    },
  });
}
