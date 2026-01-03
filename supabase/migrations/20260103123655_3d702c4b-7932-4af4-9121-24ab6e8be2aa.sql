
-- Add check constraint for referee role in event_assignments
ALTER TABLE public.event_assignments
DROP CONSTRAINT IF EXISTS event_assignments_role_check;

ALTER TABLE public.event_assignments
ADD CONSTRAINT event_assignments_role_check 
CHECK (role IN ('UTAMA', 'CADANGAN'));

-- Update default role
ALTER TABLE public.event_assignments
ALTER COLUMN role SET DEFAULT 'CADANGAN';

-- Create function to check if referee is active
CREATE OR REPLACE FUNCTION public.is_referee_active(_referee_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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

-- Create function to check schedule conflict
CREATE OR REPLACE FUNCTION public.has_schedule_conflict(_referee_id uuid, _event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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

-- Create function to validate assignment
CREATE OR REPLACE FUNCTION public.validate_referee_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if event is approved
  IF NOT is_event_approved(NEW.event_id) THEN
    RAISE EXCEPTION 'Cannot assign referee to unapproved event';
  END IF;
  
  -- Check if referee is active
  IF NOT is_referee_active(NEW.referee_id) THEN
    RAISE EXCEPTION 'Cannot assign inactive referee';
  END IF;
  
  -- Check for schedule conflict
  IF has_schedule_conflict(NEW.referee_id, NEW.event_id) THEN
    RAISE EXCEPTION 'Referee has schedule conflict on this date';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for assignment validation
DROP TRIGGER IF EXISTS validate_assignment_trigger ON public.event_assignments;
CREATE TRIGGER validate_assignment_trigger
  BEFORE INSERT OR UPDATE ON public.event_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_referee_assignment();

-- Create index for faster conflict checking
CREATE INDEX IF NOT EXISTS idx_event_assignments_referee_status 
ON public.event_assignments(referee_id, status);
