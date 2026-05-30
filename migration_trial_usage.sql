-- Add gemini_latency_ms to generations table
ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS gemini_latency_ms INTEGER;

-- Add trial_usage table to track free tier per IP
CREATE TABLE IF NOT EXISTS public.trial_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  device_fingerprint TEXT,
  analysis_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ip_address, device_fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_trial_usage_ip ON public.trial_usage(ip_address);
CREATE INDEX IF NOT EXISTS idx_trial_usage_created ON public.trial_usage(created_at DESC);

-- Enable RLS on trial_usage
ALTER TABLE public.trial_usage ENABLE ROW LEVEL SECURITY;

-- Trial usage is service-role only (backend)
CREATE POLICY IF NOT EXISTS "Service role can manage trial usage" ON public.trial_usage
  FOR ALL USING (true);

