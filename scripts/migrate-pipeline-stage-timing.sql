-- Add stage_entered_at column to pipeline table
ALTER TABLE public.pipeline 
ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ;

-- Backfill existing rows with updated_at (best approximation)
UPDATE public.pipeline 
SET stage_entered_at = updated_at 
WHERE stage_entered_at IS NULL;
