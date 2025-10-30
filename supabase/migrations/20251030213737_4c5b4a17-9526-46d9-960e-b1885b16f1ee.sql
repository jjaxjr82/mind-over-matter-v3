-- Add evening_insight column to daily_logs table
ALTER TABLE public.daily_logs ADD COLUMN evening_insight JSONB;