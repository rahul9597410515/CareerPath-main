-- Add course and provider information to recommendations table
ALTER TABLE public.recommendations
ADD COLUMN IF NOT EXISTS course_name TEXT,
ADD COLUMN IF NOT EXISTS provider TEXT,
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS duration TEXT;