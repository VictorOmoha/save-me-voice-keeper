-- Fix integer overflow in get_tier_limit_bytes function
-- The multiplication was being done as INTEGER before casting to BIGINT
-- causing overflow for values > 2GB

CREATE OR REPLACE FUNCTION public.get_tier_limit_bytes(_tier TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
BEGIN
  -- 500MB, 5GB, 50GB, 500GB
  -- Use BIGINT literals (with ::BIGINT cast) to avoid integer overflow
  RETURN CASE lower(_tier)
    WHEN 'basic' THEN (5::BIGINT * 1024 * 1024 * 1024)
    WHEN 'premium' THEN (50::BIGINT * 1024 * 1024 * 1024)
    WHEN 'enterprise' THEN (500::BIGINT * 1024 * 1024 * 1024)
    ELSE (500::BIGINT * 1024 * 1024)  -- free: 500MB
  END;
END;
$$;
