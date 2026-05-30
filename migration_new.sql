-- ============================================================
-- Croissant – New Migration (Run this after the schema setup)
-- ============================================================

-- 1. Add RLS policy for trial_usage table
ALTER TABLE public.trial_usage ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts to trial_usage (for tracking trial usage without auth)
CREATE POLICY "Allow public trial tracking" ON public.trial_usage
  FOR INSERT WITH CHECK (true);

-- Allow reading trial status (for checking if device has used trial)
CREATE POLICY "Allow public trial reads" ON public.trial_usage
  FOR SELECT USING (true);

-- 2. Create an index on combined ip + device for faster lookups
CREATE INDEX IF NOT EXISTS idx_trial_usage_ip_device ON public.trial_usage(ip_address, device_fingerprint);

-- 3. Add an updated_at trigger for trial_usage (already created but adding here for reference)
CREATE TRIGGER trial_usage_updated_at
  BEFORE UPDATE ON public.trial_usage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4. Optional: Add a policy for updates (let users update their own trial count)
CREATE POLICY "Allow public trial updates" ON public.trial_usage
  FOR UPDATE WITH CHECK (true);

-- 5. Verify generations table has all required columns
ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS gemini_latency_ms INTEGER;
ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS session_id TEXT;

-- 6. Add index for session_id lookups (for checking generation status by session)
CREATE INDEX IF NOT EXISTS idx_generations_session_id ON public.generations(session_id);

-- Summary of what this migration does:
-- - Enables RLS on trial_usage table
-- - Allows public (unauthenticated) inserts and reads to trial_usage
-- - Allows updates to trial_usage for background jobs
-- - Creates indexes for faster queries on ip+device and session_id
-- - Ensures generations table has all needed columns

-- No data changes required - this is purely schema/security setup
