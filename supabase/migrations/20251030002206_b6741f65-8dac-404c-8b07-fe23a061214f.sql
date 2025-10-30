-- Add missing columns to daily_logs table
ALTER TABLE public.daily_logs 
ADD COLUMN midday_follow_up JSONB[] DEFAULT '{}',
ADD COLUMN midday_adjustment TEXT,
ADD COLUMN win TEXT,
ADD COLUMN weakness TEXT,
ADD COLUMN tomorrows_prep TEXT;