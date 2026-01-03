-- Create provinsi table
CREATE TABLE public.provinsi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add provinsi_id to kabupaten_kota
ALTER TABLE public.kabupaten_kota 
ADD COLUMN provinsi_id uuid REFERENCES public.provinsi(id) ON DELETE SET NULL;

-- Create pengurus_level enum
CREATE TYPE public.pengurus_level AS ENUM ('PROVINSI', 'KAB_KOTA');

-- Create pengurus table for organizational officials
CREATE TABLE public.pengurus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level pengurus_level NOT NULL,
  jabatan text NOT NULL,
  provinsi_id uuid REFERENCES public.provinsi(id) ON DELETE CASCADE,
  kabupaten_kota_id uuid REFERENCES public.kabupaten_kota(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pengurus_level_check CHECK (
    (level = 'PROVINSI' AND provinsi_id IS NOT NULL AND kabupaten_kota_id IS NULL) OR
    (level = 'KAB_KOTA' AND kabupaten_kota_id IS NOT NULL)
  ),
  UNIQUE (user_id, level, provinsi_id, kabupaten_kota_id)
);

-- Enable RLS
ALTER TABLE public.provinsi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengurus ENABLE ROW LEVEL SECURITY;

-- RLS for provinsi
CREATE POLICY "Everyone can view provinsi"
ON public.provinsi FOR SELECT
USING (true);

CREATE POLICY "Admin provinsi can manage provinsi"
ON public.provinsi FOR ALL
USING (is_admin_provinsi(auth.uid()));

-- RLS for pengurus
CREATE POLICY "Everyone can view pengurus"
ON public.pengurus FOR SELECT
USING (true);

CREATE POLICY "Admin provinsi can manage all pengurus"
ON public.pengurus FOR ALL
USING (is_admin_provinsi(auth.uid()));

CREATE POLICY "Admin kab_kota can manage pengurus in their region"
ON public.pengurus FOR ALL
USING (
  has_role(auth.uid(), 'admin_kab_kota') 
  AND level = 'KAB_KOTA' 
  AND kabupaten_kota_id = get_user_kabupaten_kota(auth.uid())
);

-- Trigger for updated_at
CREATE TRIGGER update_provinsi_updated_at
BEFORE UPDATE ON public.provinsi
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pengurus_updated_at
BEFORE UPDATE ON public.pengurus
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();