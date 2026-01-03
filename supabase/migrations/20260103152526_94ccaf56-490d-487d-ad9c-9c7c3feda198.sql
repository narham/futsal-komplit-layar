-- Function to get referee income summary with filters
CREATE OR REPLACE FUNCTION public.get_referee_income_summary(
  _kabupaten_kota_id uuid DEFAULT NULL,
  _start_date date DEFAULT NULL,
  _end_date date DEFAULT NULL
)
RETURNS TABLE(
  referee_id uuid,
  referee_name text,
  kabupaten_kota_id uuid,
  kabupaten_kota_name text,
  total_verified_income bigint,
  total_pending_income bigint,
  verified_count bigint,
  pending_count bigint,
  rejected_count bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id as referee_id,
    p.full_name as referee_name,
    p.kabupaten_kota_id,
    kk.name as kabupaten_kota_name,
    COALESCE(SUM(h.amount) FILTER (WHERE h.status = 'verified'), 0)::bigint as total_verified_income,
    COALESCE(SUM(h.amount) FILTER (WHERE h.status = 'submitted'), 0)::bigint as total_pending_income,
    COUNT(*) FILTER (WHERE h.status = 'verified') as verified_count,
    COUNT(*) FILTER (WHERE h.status = 'submitted') as pending_count,
    COUNT(*) FILTER (WHERE h.status = 'rejected') as rejected_count
  FROM public.profiles p
  INNER JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'wasit'
  LEFT JOIN public.honors h ON h.referee_id = p.id
  LEFT JOIN public.events e ON e.id = h.event_id
  LEFT JOIN public.kabupaten_kota kk ON kk.id = p.kabupaten_kota_id
  WHERE (_kabupaten_kota_id IS NULL OR p.kabupaten_kota_id = _kabupaten_kota_id)
    AND (_start_date IS NULL OR e.date >= _start_date OR h.event_id IS NULL)
    AND (_end_date IS NULL OR e.date <= _end_date OR h.event_id IS NULL)
  GROUP BY p.id, p.full_name, p.kabupaten_kota_id, kk.name
  ORDER BY total_verified_income DESC;
$$;

-- Function to get referee event count with filters
CREATE OR REPLACE FUNCTION public.get_referee_event_count(
  _kabupaten_kota_id uuid DEFAULT NULL,
  _start_date date DEFAULT NULL,
  _end_date date DEFAULT NULL
)
RETURNS TABLE(
  referee_id uuid,
  referee_name text,
  kabupaten_kota_id uuid,
  kabupaten_kota_name text,
  total_events bigint,
  completed_events bigint,
  pending_events bigint,
  cancelled_events bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id as referee_id,
    p.full_name as referee_name,
    p.kabupaten_kota_id,
    kk.name as kabupaten_kota_name,
    COUNT(DISTINCT ea.event_id) as total_events,
    COUNT(DISTINCT ea.event_id) FILTER (WHERE ea.status = 'completed') as completed_events,
    COUNT(DISTINCT ea.event_id) FILTER (WHERE ea.status = 'pending' OR ea.status = 'confirmed') as pending_events,
    COUNT(DISTINCT ea.event_id) FILTER (WHERE ea.status = 'cancelled') as cancelled_events
  FROM public.profiles p
  INNER JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'wasit'
  LEFT JOIN public.event_assignments ea ON ea.referee_id = p.id
  LEFT JOIN public.events e ON e.id = ea.event_id
  LEFT JOIN public.kabupaten_kota kk ON kk.id = p.kabupaten_kota_id
  WHERE (_kabupaten_kota_id IS NULL OR p.kabupaten_kota_id = _kabupaten_kota_id)
    AND (_start_date IS NULL OR e.date >= _start_date OR ea.event_id IS NULL)
    AND (_end_date IS NULL OR e.date <= _end_date OR ea.event_id IS NULL)
  GROUP BY p.id, p.full_name, p.kabupaten_kota_id, kk.name
  ORDER BY total_events DESC;
$$;

-- Function to get admin dashboard summary with filters
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_summary(
  _kabupaten_kota_id uuid DEFAULT NULL,
  _start_date date DEFAULT NULL,
  _end_date date DEFAULT NULL
)
RETURNS TABLE(
  total_referees bigint,
  active_referees bigint,
  total_events bigint,
  completed_events bigint,
  total_verified_income bigint,
  total_pending_income bigint,
  avg_income_per_referee numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH referee_stats AS (
    SELECT 
      COUNT(DISTINCT p.id) as total_referees,
      COUNT(DISTINCT p.id) FILTER (WHERE p.is_active = true) as active_referees
    FROM public.profiles p
    INNER JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'wasit'
    WHERE (_kabupaten_kota_id IS NULL OR p.kabupaten_kota_id = _kabupaten_kota_id)
  ),
  event_stats AS (
    SELECT 
      COUNT(DISTINCT e.id) as total_events,
      COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'SELESAI') as completed_events
    FROM public.events e
    WHERE (_kabupaten_kota_id IS NULL OR e.kabupaten_kota_id = _kabupaten_kota_id)
      AND (_start_date IS NULL OR e.date >= _start_date)
      AND (_end_date IS NULL OR e.date <= _end_date)
  ),
  income_stats AS (
    SELECT 
      COALESCE(SUM(h.amount) FILTER (WHERE h.status = 'verified'), 0) as total_verified_income,
      COALESCE(SUM(h.amount) FILTER (WHERE h.status = 'submitted'), 0) as total_pending_income
    FROM public.honors h
    LEFT JOIN public.events e ON e.id = h.event_id
    LEFT JOIN public.profiles p ON p.id = h.referee_id
    WHERE (_kabupaten_kota_id IS NULL OR p.kabupaten_kota_id = _kabupaten_kota_id)
      AND (_start_date IS NULL OR e.date >= _start_date OR h.event_id IS NULL)
      AND (_end_date IS NULL OR e.date <= _end_date OR h.event_id IS NULL)
  )
  SELECT 
    rs.total_referees,
    rs.active_referees,
    es.total_events,
    es.completed_events,
    ins.total_verified_income::bigint,
    ins.total_pending_income::bigint,
    CASE WHEN rs.total_referees > 0 
      THEN ROUND(ins.total_verified_income::numeric / rs.total_referees, 2)
      ELSE 0 
    END as avg_income_per_referee
  FROM referee_stats rs, event_stats es, income_stats ins;
$$;