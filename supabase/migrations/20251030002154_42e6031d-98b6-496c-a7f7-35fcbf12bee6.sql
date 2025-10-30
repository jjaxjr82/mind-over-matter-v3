-- Create challenges table
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wisdom_library table
CREATE TABLE public.wisdom_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  tag TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create schedules table
CREATE TABLE public.schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, day_of_week)
);

-- Create daily_logs table
CREATE TABLE public.daily_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  situation TEXT,
  work_mode TEXT,
  energy_level TEXT,
  morning_insight JSONB,
  morning_follow_up JSONB[] DEFAULT '{}',
  morning_complete BOOLEAN NOT NULL DEFAULT false,
  midday_complete BOOLEAN NOT NULL DEFAULT false,
  evening_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wisdom_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for challenges
CREATE POLICY "Users can view their own challenges"
ON public.challenges FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own challenges"
ON public.challenges FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenges"
ON public.challenges FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own challenges"
ON public.challenges FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for wisdom_library
CREATE POLICY "Users can view their own wisdom"
ON public.wisdom_library FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own wisdom"
ON public.wisdom_library FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wisdom"
ON public.wisdom_library FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wisdom"
ON public.wisdom_library FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for schedules
CREATE POLICY "Users can view their own schedules"
ON public.schedules FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own schedules"
ON public.schedules FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedules"
ON public.schedules FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedules"
ON public.schedules FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for daily_logs
CREATE POLICY "Users can view their own daily logs"
ON public.daily_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own daily logs"
ON public.daily_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily logs"
ON public.daily_logs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily logs"
ON public.daily_logs FOR DELETE
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_challenges_updated_at
BEFORE UPDATE ON public.challenges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wisdom_library_updated_at
BEFORE UPDATE ON public.wisdom_library
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at
BEFORE UPDATE ON public.schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_logs_updated_at
BEFORE UPDATE ON public.daily_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();