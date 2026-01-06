-- =============================================
-- FFSS DATABASE MIGRATION - COMPLETE SCHEMA
-- Federasi Futsal Sistem Wasit
-- Generated: 2026-01-06
-- =============================================

-- =============================================
-- SECTION 1: EXTENSIONS & CUSTOM TYPES
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- Create custom enum types
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin_provinsi', 'admin_kab_kota', 'panitia', 'wasit', 'evaluator');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.pengurus_level AS ENUM ('PROVINSI', 'KAB_KOTA');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- SECTION 2: HELPER FUNCTIONS
-- =============================================

-- Function: Check if user is admin (provinsi or kab_kota)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin_provinsi'::app_role, 'admin_kab_kota'::app_role)
  )
$$;

-- Function: Check if user is admin provinsi
CREATE OR REPLACE FUNCTION public.is_admin_provinsi(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin_provinsi'::app_role
  )
$$;

-- Function: Check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function: Get user's kabupaten_kota_id
CREATE OR REPLACE FUNCTION public.get_user_kabupaten_kota(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT kabupaten_kota_id
  FROM public.profiles
  WHERE id = _user_id
$$;

-- Function: Check if user can access a region
CREATE OR REPLACE FUNCTION public.can_access_region(_user_id uuid, _kabupaten_kota_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    is_admin_provinsi(_user_id)
    OR (has_role(_user_id, 'admin_kab_kota') AND get_user_kabupaten_kota(_user_id) = _kabupaten_kota_id)
    OR (get_user_kabupaten_kota(_user_id) = _kabupaten_kota_id)
$$;

-- Function: Check if user can approve registration
CREATE OR REPLACE FUNCTION public.can_approve_registration(_admin_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    is_admin_provinsi(_admin_id)
    OR (
      has_role(_admin_id, 'admin_kab_kota') 
      AND (
        SELECT kabupaten_kota_id FROM public.profiles WHERE id = _user_id
      ) = get_user_kabupaten_kota(_admin_id)
    )
$$;

-- Function: Check if same region
CREATE OR REPLACE FUNCTION public.is_same_region(_user_id uuid, _kabupaten_kota_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id 
    AND kabupaten_kota_id = _kabupaten_kota_id
  )
$$;

-- Function: Get accessible regions for user
CREATE OR REPLACE FUNCTION public.get_accessible_regions(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE 
    WHEN is_admin_provinsi(_user_id) THEN 
      (SELECT id FROM public.kabupaten_kota)
    ELSE 
      (SELECT get_user_kabupaten_kota(_user_id))
  END
$$;

-- Function: Check if event is approved
CREATE OR REPLACE FUNCTION public.is_event_approved(_event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.events
    WHERE id = _event_id AND status = 'DISETUJUI'
  )
$$;

-- Function: Check if referee is active
CREATE OR REPLACE FUNCTION public.is_referee_active(_referee_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    INNER JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE p.id = _referee_id
      AND ur.role = 'wasit'
      AND p.is_active = true
  )
$$;

-- Function: Check for schedule conflict
CREATE OR REPLACE FUNCTION public.has_schedule_conflict(_referee_id uuid, _event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.event_assignments ea
    INNER JOIN public.events e ON e.id = ea.event_id
    WHERE ea.referee_id = _referee_id
      AND ea.event_id != _event_id
      AND e.date = (SELECT date FROM public.events WHERE id = _event_id)
      AND ea.status != 'cancelled'
  )
$$;

-- Function: Set updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Alias function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function: Handle new user registration (auto-create profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    kabupaten_kota_id,
    requested_role,
    registration_status,
    is_profile_complete,
    is_active
  )
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    (new.raw_user_meta_data->>'kabupaten_kota_id')::uuid,
    new.raw_user_meta_data->>'requested_role',
    'pending',
    false,
    true
  );
  RETURN new;
END;
$$;

-- Function: Validate referee assignment
CREATE OR REPLACE FUNCTION public.validate_referee_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT is_event_approved(NEW.event_id) THEN
    RAISE EXCEPTION 'Cannot assign referee to unapproved event';
  END IF;
  
  IF NOT is_referee_active(NEW.referee_id) THEN
    RAISE EXCEPTION 'Cannot assign inactive referee';
  END IF;
  
  IF has_schedule_conflict(NEW.referee_id, NEW.event_id) THEN
    RAISE EXCEPTION 'Referee has schedule conflict on this date';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function: Validate honor submission
CREATE OR REPLACE FUNCTION public.validate_honor_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.event_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.event_assignments
        WHERE event_id = NEW.event_id
          AND referee_id = NEW.referee_id
          AND status != 'cancelled'
      ) THEN
        RAISE EXCEPTION 'Wasit tidak ditugaskan ke event ini';
      END IF;
    END IF;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'draft' AND NEW.amount != OLD.amount THEN
      RAISE EXCEPTION 'Tidak dapat mengubah jumlah honor setelah disubmit';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function: Validate regional access
CREATE OR REPLACE FUNCTION public.validate_regional_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _target_region uuid;
BEGIN
  _target_region := COALESCE(NEW.kabupaten_kota_id, OLD.kabupaten_kota_id);
  
  IF is_admin_provinsi(_user_id) THEN
    RETURN NEW;
  END IF;
  
  IF has_role(_user_id, 'admin_kab_kota') THEN
    IF _target_region IS NOT NULL AND _target_region != get_user_kabupaten_kota(_user_id) THEN
      RAISE EXCEPTION 'Tidak dapat mengakses data wilayah lain';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function: Handle honor verification
CREATE OR REPLACE FUNCTION public.handle_honor_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status IN ('verified', 'rejected') AND OLD.status != NEW.status THEN
    NEW.verified_at = now();
  END IF;
  
  IF NEW.status = 'draft' AND OLD.status != 'draft' THEN
    NEW.verified_at = NULL;
    NEW.verified_by = NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function: Log event approval
CREATE OR REPLACE FUNCTION public.log_event_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.audit_logs (action, entity_type, entity_id, actor_id, old_data, new_data, metadata)
  VALUES (
    'EVENT_APPROVAL',
    'events',
    NEW.event_id,
    NEW.approved_by,
    jsonb_build_object('from_status', NEW.from_status),
    jsonb_build_object('to_status', NEW.to_status, 'action', NEW.action),
    jsonb_build_object('notes', NEW.notes, 'approval_id', NEW.id)
  );
  RETURN NEW;
END;
$$;

-- Function: Log honor verification
CREATE OR REPLACE FUNCTION public.log_honor_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.audit_logs (action, entity_type, entity_id, actor_id, old_data, new_data, metadata)
    VALUES (
      CASE 
        WHEN NEW.status = 'submitted' THEN 'HONOR_SUBMITTED'
        WHEN NEW.status = 'verified' THEN 'HONOR_VERIFIED'
        WHEN NEW.status = 'rejected' THEN 'HONOR_REJECTED'
        ELSE 'HONOR_STATUS_CHANGED'
      END,
      'honors',
      NEW.id,
      COALESCE(NEW.verified_by, auth.uid()),
      jsonb_build_object('status', OLD.status, 'amount', OLD.amount),
      jsonb_build_object('status', NEW.status, 'amount', NEW.amount),
      jsonb_build_object('referee_id', NEW.referee_id, 'event_id', NEW.event_id, 'notes', NEW.notes)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Function: Log referee assignment
CREATE OR REPLACE FUNCTION public.log_referee_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (action, entity_type, entity_id, actor_id, new_data, metadata)
    VALUES (
      'REFEREE_ASSIGNED',
      'event_assignments',
      NEW.id,
      auth.uid(),
      jsonb_build_object('referee_id', NEW.referee_id, 'event_id', NEW.event_id, 'role', NEW.role, 'status', NEW.status),
      jsonb_build_object('event_id', NEW.event_id)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.audit_logs (action, entity_type, entity_id, actor_id, old_data, new_data, metadata)
      VALUES (
        'REFEREE_ASSIGNMENT_UPDATED',
        'event_assignments',
        NEW.id,
        auth.uid(),
        jsonb_build_object('status', OLD.status, 'role', OLD.role),
        jsonb_build_object('status', NEW.status, 'role', NEW.role),
        jsonb_build_object('referee_id', NEW.referee_id, 'event_id', NEW.event_id)
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (action, entity_type, entity_id, actor_id, old_data, metadata)
    VALUES (
      'REFEREE_UNASSIGNED',
      'event_assignments',
      OLD.id,
      auth.uid(),
      jsonb_build_object('referee_id', OLD.referee_id, 'event_id', OLD.event_id, 'role', OLD.role, 'status', OLD.status),
      jsonb_build_object('event_id', OLD.event_id)
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Function: Log registration approval
CREATE OR REPLACE FUNCTION public.log_registration_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.registration_status IS DISTINCT FROM NEW.registration_status 
     AND NEW.registration_status IN ('approved', 'rejected') THEN
    INSERT INTO public.audit_logs (
      action, 
      entity_type, 
      entity_id, 
      actor_id, 
      old_data, 
      new_data, 
      metadata
    )
    VALUES (
      CASE 
        WHEN NEW.registration_status = 'approved' THEN 'REGISTRATION_APPROVED'
        WHEN NEW.registration_status = 'rejected' THEN 'REGISTRATION_REJECTED'
        ELSE 'REGISTRATION_STATUS_CHANGED'
      END,
      'profiles',
      NEW.id,
      COALESCE(NEW.approved_by, auth.uid()),
      jsonb_build_object('status', OLD.registration_status),
      jsonb_build_object(
        'status', NEW.registration_status, 
        'rejected_reason', NEW.rejected_reason
      ),
      jsonb_build_object(
        'full_name', NEW.full_name, 
        'requested_role', NEW.requested_role,
        'kabupaten_kota_id', NEW.kabupaten_kota_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Function: Prevent hard delete (soft delete instead)
CREATE OR REPLACE FUNCTION public.prevent_hard_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  EXECUTE format('UPDATE %I.%I SET deleted_at = now() WHERE id = $1', TG_TABLE_SCHEMA, TG_TABLE_NAME)
  USING OLD.id;
  
  INSERT INTO public.audit_logs (action, entity_type, entity_id, actor_id, old_data)
  VALUES (
    'SOFT_DELETE',
    TG_TABLE_NAME,
    OLD.id,
    auth.uid(),
    to_jsonb(OLD)
  );
  
  RETURN NULL;
END;
$$;

-- Function: Soft delete record
CREATE OR REPLACE FUNCTION public.soft_delete_record()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.deleted_at = now();
  RETURN NEW;
END;
$$;

-- Function: Update topic reply count
CREATE OR REPLACE FUNCTION public.update_topic_reply_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.discussion_topics 
    SET reply_count = reply_count + 1,
        last_reply_at = NEW.created_at
    WHERE id = NEW.topic_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.discussion_topics 
    SET reply_count = GREATEST(0, reply_count - 1)
    WHERE id = OLD.topic_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Function: Get referees with filters
CREATE OR REPLACE FUNCTION public.get_referees(
  _license_level text DEFAULT NULL,
  _is_active boolean DEFAULT NULL,
  _kabupaten_kota_id uuid DEFAULT NULL,
  _search text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  full_name text,
  birth_date date,
  kabupaten_kota_id uuid,
  kabupaten_kota_name text,
  license_level text,
  license_expiry date,
  profile_photo_url text,
  is_active boolean,
  is_profile_complete boolean,
  afk_origin text,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id,
    p.full_name,
    p.birth_date,
    p.kabupaten_kota_id,
    kk.name as kabupaten_kota_name,
    p.license_level,
    p.license_expiry,
    p.profile_photo_url,
    p.is_active,
    p.is_profile_complete,
    p.afk_origin,
    p.created_at
  FROM public.profiles p
  INNER JOIN public.user_roles ur ON ur.user_id = p.id
  LEFT JOIN public.kabupaten_kota kk ON kk.id = p.kabupaten_kota_id
  WHERE ur.role = 'wasit'
    AND p.deleted_at IS NULL
    AND (
      is_admin_provinsi(auth.uid())
      OR p.kabupaten_kota_id = get_user_kabupaten_kota(auth.uid())
    )
    AND (_license_level IS NULL OR p.license_level = _license_level)
    AND (_is_active IS NULL OR p.is_active = _is_active)
    AND (_kabupaten_kota_id IS NULL OR p.kabupaten_kota_id = _kabupaten_kota_id)
    AND (_search IS NULL OR p.full_name ILIKE '%' || _search || '%')
  ORDER BY p.full_name
$$;

-- Function: Get pending registrations
CREATE OR REPLACE FUNCTION public.get_pending_registrations()
RETURNS TABLE(
  id uuid,
  full_name text,
  kabupaten_kota_id uuid,
  kabupaten_kota_name text,
  requested_role text,
  registration_status text,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id,
    p.full_name,
    p.kabupaten_kota_id,
    kk.name as kabupaten_kota_name,
    p.requested_role,
    p.registration_status,
    p.created_at
  FROM public.profiles p
  LEFT JOIN public.kabupaten_kota kk ON kk.id = p.kabupaten_kota_id
  WHERE p.registration_status = 'pending'
    AND (
      is_admin_provinsi(auth.uid())
      OR (
        has_role(auth.uid(), 'admin_kab_kota') 
        AND p.kabupaten_kota_id = get_user_kabupaten_kota(auth.uid())
      )
    )
  ORDER BY p.created_at ASC;
$$;

-- Function: Get registration history
CREATE OR REPLACE FUNCTION public.get_registration_history()
RETURNS TABLE(
  id uuid,
  full_name text,
  kabupaten_kota_id uuid,
  kabupaten_kota_name text,
  requested_role text,
  registration_status text,
  rejected_reason text,
  approved_at timestamp with time zone,
  approved_by uuid,
  approver_name text,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id,
    p.full_name,
    p.kabupaten_kota_id,
    kk.name as kabupaten_kota_name,
    p.requested_role,
    p.registration_status,
    p.rejected_reason,
    p.approved_at,
    p.approved_by,
    approver.full_name as approver_name,
    p.created_at
  FROM public.profiles p
  LEFT JOIN public.kabupaten_kota kk ON kk.id = p.kabupaten_kota_id
  LEFT JOIN public.profiles approver ON approver.id = p.approved_by
  WHERE p.registration_status IN ('approved', 'rejected')
    AND p.approved_at IS NOT NULL
    AND (
      is_admin_provinsi(auth.uid())
      OR (
        has_role(auth.uid(), 'admin_kab_kota') 
        AND p.kabupaten_kota_id = get_user_kabupaten_kota(auth.uid())
      )
    )
  ORDER BY p.approved_at DESC;
$$;

-- Function: Get audit logs
CREATE OR REPLACE FUNCTION public.get_audit_logs(
  _entity_type text DEFAULT NULL,
  _entity_id uuid DEFAULT NULL,
  _action text DEFAULT NULL,
  _actor_id uuid DEFAULT NULL,
  _start_date timestamp with time zone DEFAULT NULL,
  _end_date timestamp with time zone DEFAULT NULL,
  _limit integer DEFAULT 100,
  _offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  action text,
  entity_type text,
  entity_id uuid,
  actor_id uuid,
  actor_name text,
  old_data jsonb,
  new_data jsonb,
  metadata jsonb,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    al.id,
    al.action,
    al.entity_type,
    al.entity_id,
    al.actor_id,
    p.full_name as actor_name,
    al.old_data,
    al.new_data,
    al.metadata,
    al.created_at
  FROM public.audit_logs al
  LEFT JOIN public.profiles p ON p.id = al.actor_id
  WHERE (_entity_type IS NULL OR al.entity_type = _entity_type)
    AND (_entity_id IS NULL OR al.entity_id = _entity_id)
    AND (_action IS NULL OR al.action = _action)
    AND (_actor_id IS NULL OR al.actor_id = _actor_id)
    AND (_start_date IS NULL OR al.created_at >= _start_date)
    AND (_end_date IS NULL OR al.created_at <= _end_date)
  ORDER BY al.created_at DESC
  LIMIT _limit
  OFFSET _offset;
$$;

-- Function: Get admin dashboard summary
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

-- Function: Get referee income summary
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

-- Function: Get referee event count
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

-- Function: Get honor statistics
CREATE OR REPLACE FUNCTION public.get_honor_statistics(_referee_id uuid DEFAULT NULL)
RETURNS TABLE(
  referee_id uuid,
  total_verified bigint,
  total_pending bigint,
  total_rejected bigint,
  total_earned bigint,
  pending_amount bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    h.referee_id,
    COUNT(*) FILTER (WHERE h.status = 'verified') as total_verified,
    COUNT(*) FILTER (WHERE h.status = 'submitted') as total_pending,
    COUNT(*) FILTER (WHERE h.status = 'rejected') as total_rejected,
    COALESCE(SUM(h.amount) FILTER (WHERE h.status = 'verified'), 0) as total_earned,
    COALESCE(SUM(h.amount) FILTER (WHERE h.status = 'submitted'), 0) as pending_amount
  FROM public.honors h
  WHERE (_referee_id IS NULL OR h.referee_id = _referee_id)
  GROUP BY h.referee_id
$$;

-- =============================================
-- SECTION 3: TABLES
-- =============================================

-- Table: provinsi (Province)
CREATE TABLE IF NOT EXISTS public.provinsi (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  code text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: kabupaten_kota (City/Regency)
CREATE TABLE IF NOT EXISTS public.kabupaten_kota (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  code text,
  provinsi_id uuid REFERENCES public.provinsi(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: profiles (User Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY,
  full_name text NOT NULL,
  birth_date date,
  kabupaten_kota_id uuid REFERENCES public.kabupaten_kota(id),
  profile_photo_url text,
  license_level text,
  license_expiry date,
  license_photo_url text,
  ktp_photo_url text,
  afk_origin text,
  occupation text,
  is_active boolean DEFAULT true,
  is_profile_complete boolean DEFAULT false,
  requested_role text,
  registration_status text DEFAULT 'pending',
  rejected_reason text,
  approved_by uuid,
  approved_at timestamp with time zone,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: user_roles (User Role Assignments)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Table: pengurus (Organization Committee)
CREATE TABLE IF NOT EXISTS public.pengurus (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  level public.pengurus_level NOT NULL,
  jabatan text NOT NULL,
  provinsi_id uuid REFERENCES public.provinsi(id),
  kabupaten_kota_id uuid REFERENCES public.kabupaten_kota(id),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: events (Events/Matches)
CREATE TABLE IF NOT EXISTS public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  date date NOT NULL,
  location text,
  category text,
  description text,
  status text DEFAULT 'DIAJUKAN',
  kabupaten_kota_id uuid REFERENCES public.kabupaten_kota(id),
  created_by uuid REFERENCES public.profiles(id),
  deleted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: event_approvals (Event Approval History)
CREATE TABLE IF NOT EXISTS public.event_approvals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  action text NOT NULL,
  from_status text,
  to_status text NOT NULL,
  approved_by uuid REFERENCES public.profiles(id),
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: event_assignments (Referee Assignments)
CREATE TABLE IF NOT EXISTS public.event_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  referee_id uuid NOT NULL REFERENCES public.profiles(id),
  role text DEFAULT 'CADANGAN',
  status text DEFAULT 'pending',
  cancellation_reason text,
  cancelled_by uuid REFERENCES public.profiles(id),
  deleted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(event_id, referee_id)
);

-- Add check constraint for event_assignments status
DO $$ BEGIN
  ALTER TABLE public.event_assignments 
    DROP CONSTRAINT IF EXISTS event_assignments_status_check;
  ALTER TABLE public.event_assignments 
    ADD CONSTRAINT event_assignments_status_check 
    CHECK (status IN ('pending', 'confirmed', 'declined', 'cancelled', 'completed'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Table: honors (Referee Income/Payments)
CREATE TABLE IF NOT EXISTS public.honors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referee_id uuid NOT NULL REFERENCES public.profiles(id),
  event_id uuid REFERENCES public.events(id),
  amount integer NOT NULL,
  status text DEFAULT 'draft',
  notes text,
  verified_by uuid REFERENCES public.profiles(id),
  verified_at timestamp with time zone,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: referee_reviews (Public Reviews for Referees)
CREATE TABLE IF NOT EXISTS public.referee_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referee_id uuid NOT NULL REFERENCES public.profiles(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  reviewer_name text,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: audit_logs (Audit Trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  actor_id uuid REFERENCES public.profiles(id),
  old_data jsonb,
  new_data jsonb,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table: evaluation_criteria (Evaluation Criteria)
CREATE TABLE IF NOT EXISTS public.evaluation_criteria (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  weight integer DEFAULT 1,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: evaluations (Referee Evaluations)
CREATE TABLE IF NOT EXISTS public.evaluations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referee_id uuid NOT NULL REFERENCES public.profiles(id),
  evaluator_id uuid NOT NULL REFERENCES public.profiles(id),
  event_id uuid NOT NULL REFERENCES public.events(id),
  total_score numeric,
  status text DEFAULT 'draft',
  notes text,
  submitted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: evaluation_scores (Evaluation Scores)
CREATE TABLE IF NOT EXISTS public.evaluation_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  evaluation_id uuid NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
  criteria_id uuid NOT NULL REFERENCES public.evaluation_criteria(id),
  score integer NOT NULL CHECK (score >= 0 AND score <= 100),
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: learning_materials (Learning Materials)
CREATE TABLE IF NOT EXISTS public.learning_materials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  category text NOT NULL,
  content text NOT NULL,
  description text,
  law_number integer,
  video_url text,
  pdf_url text,
  difficulty_level text DEFAULT 'basic',
  is_published boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: learning_progress (User Learning Progress)
CREATE TABLE IF NOT EXISTS public.learning_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  material_id uuid NOT NULL REFERENCES public.learning_materials(id),
  is_completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, material_id)
);

-- Table: discussion_topics (Forum Discussion Topics)
CREATE TABLE IF NOT EXISTS public.discussion_topics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL,
  law_reference integer,
  author_id uuid NOT NULL REFERENCES public.profiles(id),
  is_pinned boolean DEFAULT false,
  is_locked boolean DEFAULT false,
  view_count integer DEFAULT 0,
  reply_count integer DEFAULT 0,
  last_reply_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: discussion_replies (Forum Replies)
CREATE TABLE IF NOT EXISTS public.discussion_replies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id uuid NOT NULL REFERENCES public.discussion_topics(id) ON DELETE CASCADE,
  parent_reply_id uuid REFERENCES public.discussion_replies(id),
  author_id uuid NOT NULL REFERENCES public.profiles(id),
  content text NOT NULL,
  is_solution boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- =============================================
-- SECTION 4: VIEWS
-- =============================================

-- View: active_events
CREATE OR REPLACE VIEW public.active_events AS
SELECT * FROM public.events WHERE deleted_at IS NULL;

-- View: active_honors
CREATE OR REPLACE VIEW public.active_honors AS
SELECT * FROM public.honors WHERE deleted_at IS NULL;

-- View: active_profiles
CREATE OR REPLACE VIEW public.active_profiles AS
SELECT * FROM public.profiles WHERE deleted_at IS NULL;

-- View: referee_review_stats
CREATE OR REPLACE VIEW public.referee_review_stats AS
SELECT 
  referee_id,
  AVG(rating)::numeric as avg_rating,
  COUNT(*)::integer as total_reviews
FROM public.referee_reviews
GROUP BY referee_id;

-- =============================================
-- SECTION 5: INDEXES
-- =============================================

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_kabupaten_kota_id ON public.profiles(kabupaten_kota_id);
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON public.profiles(deleted_at);
CREATE INDEX IF NOT EXISTS idx_profiles_registration_status ON public.profiles(registration_status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- Indexes for user_roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Indexes for events
CREATE INDEX IF NOT EXISTS idx_events_kabupaten_kota_id ON public.events(kabupaten_kota_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_deleted_at ON public.events(deleted_at);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);

-- Indexes for event_assignments
CREATE INDEX IF NOT EXISTS idx_event_assignments_event_id ON public.event_assignments(event_id);
CREATE INDEX IF NOT EXISTS idx_event_assignments_referee_id ON public.event_assignments(referee_id);
CREATE INDEX IF NOT EXISTS idx_event_assignments_status ON public.event_assignments(status);
CREATE INDEX IF NOT EXISTS idx_event_assignments_deleted_at ON public.event_assignments(deleted_at);

-- Indexes for honors
CREATE INDEX IF NOT EXISTS idx_honors_referee_id ON public.honors(referee_id);
CREATE INDEX IF NOT EXISTS idx_honors_event_id ON public.honors(event_id);
CREATE INDEX IF NOT EXISTS idx_honors_status ON public.honors(status);
CREATE INDEX IF NOT EXISTS idx_honors_deleted_at ON public.honors(deleted_at);

-- Indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON public.audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Indexes for evaluations
CREATE INDEX IF NOT EXISTS idx_evaluations_referee_id ON public.evaluations(referee_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_evaluator_id ON public.evaluations(evaluator_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_event_id ON public.evaluations(event_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_status ON public.evaluations(status);

-- Indexes for learning
CREATE INDEX IF NOT EXISTS idx_learning_materials_category ON public.learning_materials(category);
CREATE INDEX IF NOT EXISTS idx_learning_materials_is_published ON public.learning_materials(is_published);
CREATE INDEX IF NOT EXISTS idx_learning_progress_user_id ON public.learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_material_id ON public.learning_progress(material_id);

-- Indexes for discussions
CREATE INDEX IF NOT EXISTS idx_discussion_topics_author_id ON public.discussion_topics(author_id);
CREATE INDEX IF NOT EXISTS idx_discussion_topics_category ON public.discussion_topics(category);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_topic_id ON public.discussion_replies(topic_id);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_author_id ON public.discussion_replies(author_id);

-- Indexes for referee_reviews
CREATE INDEX IF NOT EXISTS idx_referee_reviews_referee_id ON public.referee_reviews(referee_id);

-- =============================================
-- SECTION 6: TRIGGERS
-- =============================================

-- Triggers for updated_at
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_events ON public.events;
CREATE TRIGGER set_updated_at_events
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_event_assignments ON public.event_assignments;
CREATE TRIGGER set_updated_at_event_assignments
  BEFORE UPDATE ON public.event_assignments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_honors ON public.honors;
CREATE TRIGGER set_updated_at_honors
  BEFORE UPDATE ON public.honors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_evaluations ON public.evaluations;
CREATE TRIGGER set_updated_at_evaluations
  BEFORE UPDATE ON public.evaluations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_learning_materials ON public.learning_materials;
CREATE TRIGGER set_updated_at_learning_materials
  BEFORE UPDATE ON public.learning_materials
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_discussion_topics ON public.discussion_topics;
CREATE TRIGGER set_updated_at_discussion_topics
  BEFORE UPDATE ON public.discussion_topics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_discussion_replies ON public.discussion_replies;
CREATE TRIGGER set_updated_at_discussion_replies
  BEFORE UPDATE ON public.discussion_replies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_pengurus ON public.pengurus;
CREATE TRIGGER set_updated_at_pengurus
  BEFORE UPDATE ON public.pengurus
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_kabupaten_kota ON public.kabupaten_kota;
CREATE TRIGGER set_updated_at_kabupaten_kota
  BEFORE UPDATE ON public.kabupaten_kota
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_provinsi ON public.provinsi;
CREATE TRIGGER set_updated_at_provinsi
  BEFORE UPDATE ON public.provinsi
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_evaluation_criteria ON public.evaluation_criteria;
CREATE TRIGGER set_updated_at_evaluation_criteria
  BEFORE UPDATE ON public.evaluation_criteria
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger for logging event approval
DROP TRIGGER IF EXISTS log_event_approval_trigger ON public.event_approvals;
CREATE TRIGGER log_event_approval_trigger
  AFTER INSERT ON public.event_approvals
  FOR EACH ROW EXECUTE FUNCTION public.log_event_approval();

-- Trigger for logging honor verification
DROP TRIGGER IF EXISTS log_honor_verification_trigger ON public.honors;
CREATE TRIGGER log_honor_verification_trigger
  AFTER UPDATE ON public.honors
  FOR EACH ROW EXECUTE FUNCTION public.log_honor_verification();

-- Trigger for honor verification handling
DROP TRIGGER IF EXISTS handle_honor_verification_trigger ON public.honors;
CREATE TRIGGER handle_honor_verification_trigger
  BEFORE UPDATE ON public.honors
  FOR EACH ROW EXECUTE FUNCTION public.handle_honor_verification();

-- Trigger for logging registration approval
DROP TRIGGER IF EXISTS log_registration_approval_trigger ON public.profiles;
CREATE TRIGGER log_registration_approval_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_registration_approval();

-- Trigger for logging referee assignment
DROP TRIGGER IF EXISTS log_referee_assignment_trigger ON public.event_assignments;
CREATE TRIGGER log_referee_assignment_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.event_assignments
  FOR EACH ROW EXECUTE FUNCTION public.log_referee_assignment();

-- Trigger for updating topic reply count
DROP TRIGGER IF EXISTS update_topic_reply_count_trigger ON public.discussion_replies;
CREATE TRIGGER update_topic_reply_count_trigger
  AFTER INSERT OR DELETE ON public.discussion_replies
  FOR EACH ROW EXECUTE FUNCTION public.update_topic_reply_count();

-- Trigger for validating honor submission
DROP TRIGGER IF EXISTS validate_honor_submission_trigger ON public.honors;
CREATE TRIGGER validate_honor_submission_trigger
  BEFORE INSERT OR UPDATE ON public.honors
  FOR EACH ROW EXECUTE FUNCTION public.validate_honor_submission();

-- =============================================
-- SECTION 7: ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE public.provinsi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kabupaten_kota ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengurus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.honors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referee_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_replies ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SECTION 8: RLS POLICIES
-- =============================================

-- =====================
-- Provinsi Policies
-- =====================
DROP POLICY IF EXISTS "Everyone can view provinsi" ON public.provinsi;
CREATE POLICY "Everyone can view provinsi" ON public.provinsi
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin provinsi can manage provinsi" ON public.provinsi;
CREATE POLICY "Admin provinsi can manage provinsi" ON public.provinsi
  FOR ALL USING (is_admin_provinsi(auth.uid()));

-- =====================
-- Kabupaten Kota Policies
-- =====================
DROP POLICY IF EXISTS "Everyone can view kabupaten_kota" ON public.kabupaten_kota;
CREATE POLICY "Everyone can view kabupaten_kota" ON public.kabupaten_kota
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin provinsi can manage kabupaten_kota" ON public.kabupaten_kota;
CREATE POLICY "Admin provinsi can manage kabupaten_kota" ON public.kabupaten_kota
  FOR ALL USING (is_admin_provinsi(auth.uid()));

-- =====================
-- Profiles Policies
-- =====================
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile during signup" ON public.profiles;
CREATE POLICY "Users can insert their own profile during signup" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admin provinsi can view all profiles" ON public.profiles;
CREATE POLICY "Admin provinsi can view all profiles" ON public.profiles
  FOR SELECT USING (is_admin_provinsi(auth.uid()));

DROP POLICY IF EXISTS "Admin provinsi can update all profiles" ON public.profiles;
CREATE POLICY "Admin provinsi can update all profiles" ON public.profiles
  FOR UPDATE USING (is_admin_provinsi(auth.uid()));

DROP POLICY IF EXISTS "Admin provinsi can insert profiles" ON public.profiles;
CREATE POLICY "Admin provinsi can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (is_admin_provinsi(auth.uid()));

DROP POLICY IF EXISTS "Admin kab_kota can view profiles in their region" ON public.profiles;
CREATE POLICY "Admin kab_kota can view profiles in their region" ON public.profiles
  FOR SELECT USING (
    has_role(auth.uid(), 'admin_kab_kota') 
    AND kabupaten_kota_id = get_user_kabupaten_kota(auth.uid())
  );

DROP POLICY IF EXISTS "Admin kab_kota can update profiles in their region" ON public.profiles;
CREATE POLICY "Admin kab_kota can update profiles in their region" ON public.profiles
  FOR UPDATE USING (
    has_role(auth.uid(), 'admin_kab_kota') 
    AND kabupaten_kota_id = get_user_kabupaten_kota(auth.uid())
  );

DROP POLICY IF EXISTS "Public can view referee profiles" ON public.profiles;
CREATE POLICY "Public can view referee profiles" ON public.profiles
  FOR SELECT USING (deleted_at IS NULL);

-- =====================
-- User Roles Policies
-- =====================
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin provinsi can manage user_roles" ON public.user_roles;
CREATE POLICY "Admin provinsi can manage user_roles" ON public.user_roles
  FOR ALL USING (is_admin_provinsi(auth.uid()));

-- =====================
-- Pengurus Policies
-- =====================
DROP POLICY IF EXISTS "Everyone can view pengurus" ON public.pengurus;
CREATE POLICY "Everyone can view pengurus" ON public.pengurus
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin provinsi can manage all pengurus" ON public.pengurus;
CREATE POLICY "Admin provinsi can manage all pengurus" ON public.pengurus
  FOR ALL USING (is_admin_provinsi(auth.uid()));

DROP POLICY IF EXISTS "Admin kab_kota can manage pengurus in their region" ON public.pengurus;
CREATE POLICY "Admin kab_kota can manage pengurus in their region" ON public.pengurus
  FOR ALL USING (
    has_role(auth.uid(), 'admin_kab_kota') 
    AND level = 'KAB_KOTA'::pengurus_level 
    AND kabupaten_kota_id = get_user_kabupaten_kota(auth.uid())
  );

-- =====================
-- Events Policies
-- =====================
DROP POLICY IF EXISTS "Everyone can view events" ON public.events;
CREATE POLICY "Everyone can view events" ON public.events
  FOR SELECT USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Admin and panitia can create events" ON public.events;
CREATE POLICY "Admin and panitia can create events" ON public.events
  FOR INSERT WITH CHECK (
    is_admin(auth.uid()) 
    OR has_role(auth.uid(), 'panitia')
  );

DROP POLICY IF EXISTS "Admins can update events" ON public.events;
CREATE POLICY "Admins can update events" ON public.events
  FOR UPDATE USING (
    deleted_at IS NULL 
    AND (
      is_admin_provinsi(auth.uid()) 
      OR (has_role(auth.uid(), 'admin_kab_kota') AND kabupaten_kota_id = get_user_kabupaten_kota(auth.uid()))
      OR (has_role(auth.uid(), 'panitia') AND created_by = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can delete events" ON public.events;
CREATE POLICY "Admins can delete events" ON public.events
  FOR UPDATE USING (
    deleted_at IS NULL 
    AND is_admin_provinsi(auth.uid())
  );

-- =====================
-- Event Approvals Policies
-- =====================
DROP POLICY IF EXISTS "Everyone can view event approvals" ON public.event_approvals;
CREATE POLICY "Everyone can view event approvals" ON public.event_approvals
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can insert approvals" ON public.event_approvals;
CREATE POLICY "Admin can insert approvals" ON public.event_approvals
  FOR INSERT WITH CHECK (
    is_admin(auth.uid()) 
    OR has_role(auth.uid(), 'panitia')
  );

-- =====================
-- Event Assignments Policies
-- =====================
DROP POLICY IF EXISTS "Referees can view their own assignments" ON public.event_assignments;
CREATE POLICY "Referees can view their own assignments" ON public.event_assignments
  FOR SELECT USING (
    deleted_at IS NULL 
    AND auth.uid() = referee_id
  );

DROP POLICY IF EXISTS "Admins can view all assignments" ON public.event_assignments;
CREATE POLICY "Admins can view all assignments" ON public.event_assignments
  FOR SELECT USING (
    deleted_at IS NULL 
    AND is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Admins can manage assignments on approved events" ON public.event_assignments;
CREATE POLICY "Admins can manage assignments on approved events" ON public.event_assignments
  FOR ALL 
  USING (deleted_at IS NULL AND is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Referees can update their own assignment status" ON public.event_assignments;
CREATE POLICY "Referees can update their own assignment status" ON public.event_assignments
  FOR UPDATE 
  USING (referee_id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (referee_id = auth.uid() AND status IN ('confirmed', 'declined'));

-- =====================
-- Honors Policies
-- =====================
DROP POLICY IF EXISTS "Referees can view their own honors" ON public.honors;
CREATE POLICY "Referees can view their own honors" ON public.honors
  FOR SELECT USING (
    deleted_at IS NULL 
    AND auth.uid() = referee_id
  );

DROP POLICY IF EXISTS "Admins can view all honors" ON public.honors;
CREATE POLICY "Admins can view all honors" ON public.honors
  FOR SELECT USING (
    deleted_at IS NULL 
    AND is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Referees can create their own honors" ON public.honors;
CREATE POLICY "Referees can create their own honors" ON public.honors
  FOR INSERT WITH CHECK (auth.uid() = referee_id);

DROP POLICY IF EXISTS "Referees can update their own draft honors" ON public.honors;
CREATE POLICY "Referees can update their own draft honors" ON public.honors
  FOR UPDATE USING (
    auth.uid() = referee_id 
    AND status = 'draft'
  );

DROP POLICY IF EXISTS "Referees can delete their own draft honors" ON public.honors;
CREATE POLICY "Referees can delete their own draft honors" ON public.honors
  FOR UPDATE USING (
    deleted_at IS NULL 
    AND auth.uid() = referee_id 
    AND status = 'draft'
  );

DROP POLICY IF EXISTS "Admins can update all honors" ON public.honors;
CREATE POLICY "Admins can update all honors" ON public.honors
  FOR UPDATE USING (is_admin(auth.uid()));

-- =====================
-- Referee Reviews Policies
-- =====================
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.referee_reviews;
CREATE POLICY "Anyone can view reviews" ON public.referee_reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can submit reviews" ON public.referee_reviews;
CREATE POLICY "Anyone can submit reviews" ON public.referee_reviews
  FOR INSERT WITH CHECK (true);

-- =====================
-- Audit Logs Policies
-- =====================
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- =====================
-- Evaluation Criteria Policies
-- =====================
DROP POLICY IF EXISTS "Everyone can view active criteria" ON public.evaluation_criteria;
CREATE POLICY "Everyone can view active criteria" ON public.evaluation_criteria
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admin can manage criteria" ON public.evaluation_criteria;
CREATE POLICY "Admin can manage criteria" ON public.evaluation_criteria
  FOR ALL USING (is_admin(auth.uid()));

-- =====================
-- Evaluations Policies
-- =====================
DROP POLICY IF EXISTS "Admins can view all evaluations" ON public.evaluations;
CREATE POLICY "Admins can view all evaluations" ON public.evaluations
  FOR SELECT USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Evaluators can view their own evaluations" ON public.evaluations;
CREATE POLICY "Evaluators can view their own evaluations" ON public.evaluations
  FOR SELECT USING (auth.uid() = evaluator_id);

DROP POLICY IF EXISTS "Referees can view their own evaluations" ON public.evaluations;
CREATE POLICY "Referees can view their own evaluations" ON public.evaluations
  FOR SELECT USING (
    auth.uid() = referee_id 
    AND status = 'submitted'
  );

DROP POLICY IF EXISTS "Evaluators can create evaluations" ON public.evaluations;
CREATE POLICY "Evaluators can create evaluations" ON public.evaluations
  FOR INSERT WITH CHECK (auth.uid() = evaluator_id);

DROP POLICY IF EXISTS "Evaluators can update their draft evaluations" ON public.evaluations;
CREATE POLICY "Evaluators can update their draft evaluations" ON public.evaluations
  FOR UPDATE USING (
    auth.uid() = evaluator_id 
    AND status = 'draft'
  );

DROP POLICY IF EXISTS "Admin can update all evaluations" ON public.evaluations;
CREATE POLICY "Admin can update all evaluations" ON public.evaluations
  FOR UPDATE USING (is_admin(auth.uid()));

-- =====================
-- Evaluation Scores Policies
-- =====================
DROP POLICY IF EXISTS "View scores for accessible evaluations" ON public.evaluation_scores;
CREATE POLICY "View scores for accessible evaluations" ON public.evaluation_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM evaluations e
      WHERE e.id = evaluation_scores.evaluation_id 
      AND (
        is_admin(auth.uid()) 
        OR e.evaluator_id = auth.uid() 
        OR (e.referee_id = auth.uid() AND e.status = 'submitted')
      )
    )
  );

DROP POLICY IF EXISTS "Evaluators can manage scores for their evaluations" ON public.evaluation_scores;
CREATE POLICY "Evaluators can manage scores for their evaluations" ON public.evaluation_scores
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM evaluations e
      WHERE e.id = evaluation_scores.evaluation_id 
      AND e.evaluator_id = auth.uid() 
      AND e.status = 'draft'
    )
  );

DROP POLICY IF EXISTS "Admin can manage all scores" ON public.evaluation_scores;
CREATE POLICY "Admin can manage all scores" ON public.evaluation_scores
  FOR ALL USING (is_admin(auth.uid()));

-- =====================
-- Learning Materials Policies
-- =====================
DROP POLICY IF EXISTS "Everyone can view published materials" ON public.learning_materials;
CREATE POLICY "Everyone can view published materials" ON public.learning_materials
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Admin can manage all materials" ON public.learning_materials;
CREATE POLICY "Admin can manage all materials" ON public.learning_materials
  FOR ALL USING (is_admin(auth.uid()));

-- =====================
-- Learning Progress Policies
-- =====================
DROP POLICY IF EXISTS "Users can view their own progress" ON public.learning_progress;
CREATE POLICY "Users can view their own progress" ON public.learning_progress
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own progress" ON public.learning_progress;
CREATE POLICY "Users can insert their own progress" ON public.learning_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own progress" ON public.learning_progress;
CREATE POLICY "Users can update their own progress" ON public.learning_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================
-- Discussion Topics Policies
-- =====================
DROP POLICY IF EXISTS "Authenticated users can view topics" ON public.discussion_topics;
CREATE POLICY "Authenticated users can view topics" ON public.discussion_topics
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can create topics" ON public.discussion_topics;
CREATE POLICY "Authenticated users can create topics" ON public.discussion_topics
  FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can update their own topics" ON public.discussion_topics;
CREATE POLICY "Authors can update their own topics" ON public.discussion_topics
  FOR UPDATE USING (
    auth.uid() = author_id 
    OR is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Authors can delete their own topics" ON public.discussion_topics;
CREATE POLICY "Authors can delete their own topics" ON public.discussion_topics
  FOR DELETE USING (
    auth.uid() = author_id 
    OR is_admin(auth.uid())
  );

-- =====================
-- Discussion Replies Policies
-- =====================
DROP POLICY IF EXISTS "Authenticated users can view replies" ON public.discussion_replies;
CREATE POLICY "Authenticated users can view replies" ON public.discussion_replies
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can create replies" ON public.discussion_replies;
CREATE POLICY "Authenticated users can create replies" ON public.discussion_replies
  FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can update their own replies" ON public.discussion_replies;
CREATE POLICY "Authors can update their own replies" ON public.discussion_replies
  FOR UPDATE USING (
    auth.uid() = author_id 
    OR is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Authors can delete their own replies" ON public.discussion_replies;
CREATE POLICY "Authors can delete their own replies" ON public.discussion_replies
  FOR DELETE USING (
    auth.uid() = author_id 
    OR is_admin(auth.uid())
  );

-- =============================================
-- SECTION 9: STORAGE BUCKETS & POLICIES
-- =============================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket (Private)
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
CREATE POLICY "Authenticated users can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
CREATE POLICY "Users can view their own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Admins can view all documents" ON storage.objects;
CREATE POLICY "Admins can view all documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' 
    AND is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
CREATE POLICY "Users can update their own documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
CREATE POLICY "Users can delete their own documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for avatars bucket (Public)
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
CREATE POLICY "Users can update their own avatars" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
CREATE POLICY "Users can delete their own avatars" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =============================================
-- SECTION 10: AUTH TRIGGER (Run separately after migration)
-- =============================================

-- Create trigger for new user registration
-- Note: This needs to be run AFTER the migration is complete
-- because it references the auth.users table

-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- SECTION 11: REALTIME CONFIGURATION (Optional)
-- =============================================

-- Enable realtime for discussion tables
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.discussion_topics;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.discussion_replies;

-- =============================================
-- END OF MIGRATION
-- =============================================
