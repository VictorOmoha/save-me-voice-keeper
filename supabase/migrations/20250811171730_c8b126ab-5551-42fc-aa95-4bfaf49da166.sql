-- Create triggers to keep storage usage up to date

-- Trigger to refresh DB usage when entries change
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_entries_refresh_db_usage'
  ) THEN
    CREATE TRIGGER trg_entries_refresh_db_usage
    AFTER INSERT OR UPDATE OR DELETE ON public.entries
    FOR EACH ROW EXECUTE FUNCTION public.trg_refresh_db_usage();
  END IF;
END $$;

-- Trigger to adjust file usage when user_files are inserted or deleted
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_user_files_adjust_usage'
  ) THEN
    CREATE TRIGGER trg_user_files_adjust_usage
    AFTER INSERT OR DELETE ON public.user_files
    FOR EACH ROW EXECUTE FUNCTION public.trg_adjust_file_usage();
  END IF;
END $$;