-- Add completed_action_items column to daily_logs table
ALTER TABLE public.daily_logs
ADD COLUMN completed_action_items JSONB DEFAULT '{}'::jsonb;