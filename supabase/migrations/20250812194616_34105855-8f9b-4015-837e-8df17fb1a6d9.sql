
-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.user_storage_usage ENABLE ROW LEVEL SECURITY;

-- Make intent explicit: block all direct writes by authenticated users.
-- SECURITY DEFINER functions that maintain this table will continue to work.
DROP POLICY IF EXISTS "No direct insert into user_storage_usage" ON public.user_storage_usage;
CREATE POLICY "No direct insert into user_storage_usage"
  ON public.user_storage_usage
  FOR INSERT
  WITH CHECK (false);

DROP POLICY IF EXISTS "No direct update to user_storage_usage" ON public.user_storage_usage;
CREATE POLICY "No direct update to user_storage_usage"
  ON public.user_storage_usage
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "No direct delete from user_storage_usage" ON public.user_storage_usage;
CREATE POLICY "No direct delete from user_storage_usage"
  ON public.user_storage_usage
  FOR DELETE
  USING (false);

-- Add triggers so usage remains accurate without client writes

-- Keep DB usage fresh when entries change
DROP TRIGGER IF EXISTS entries_refresh_usage_aiud ON public.entries;
CREATE TRIGGER entries_refresh_usage_aiud
AFTER INSERT OR UPDATE OR DELETE ON public.entries
FOR EACH ROW
EXECUTE FUNCTION public.trg_refresh_db_usage();

-- Adjust file usage when files are added/removed
DROP TRIGGER IF EXISTS user_files_adjust_usage_aid ON public.user_files;
CREATE TRIGGER user_files_adjust_usage_aid
AFTER INSERT OR DELETE ON public.user_files
FOR EACH ROW
EXECUTE FUNCTION public.trg_adjust_file_usage();
