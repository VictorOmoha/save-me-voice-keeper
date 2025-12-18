-- Add payment_failed column to subscribers table for tracking failed payment attempts
ALTER TABLE public.subscribers
ADD COLUMN IF NOT EXISTS payment_failed BOOLEAN DEFAULT false;

-- Add index for quick lookup of failed payments
CREATE INDEX IF NOT EXISTS idx_subscribers_payment_failed
ON public.subscribers (payment_failed)
WHERE payment_failed = true;

-- Comment explaining the column
COMMENT ON COLUMN public.subscribers.payment_failed IS 'True when the most recent payment attempt failed - used for grace period handling';
