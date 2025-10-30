-- Function to seed wisdom library and challenges for the current user
-- Run this in SQL editor, then call it from your app after logging in

CREATE OR REPLACE FUNCTION public.seed_user_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert wisdom sources
  INSERT INTO public.wisdom_library (user_id, name, description, tag, is_active) VALUES
    (auth.uid(), 'Marcus Aurelius - Meditations', 'Stoic philosophy on duty, resilience, and inner peace', 'Philosophy', true),
    (auth.uid(), 'Ryan Holiday - The Obstacle Is The Way', 'Modern Stoicism applied to overcoming challenges', 'Philosophy', true),
    (auth.uid(), 'Naval Ravikant - Almanack', 'Wealth creation, happiness, and decision-making principles', 'Business', true),
    (auth.uid(), 'Ray Dalio - Principles', 'Life and work principles for decision-making', 'Business', true),
    (auth.uid(), 'Viktor Frankl - Man''s Search for Meaning', 'Finding purpose through suffering', 'Psychology', true),
    (auth.uid(), 'Jordan Peterson - 12 Rules for Life', 'Practical wisdom for personal responsibility', 'Psychology', true),
    (auth.uid(), 'James Clear - Atomic Habits', 'Building better habits through small changes', 'Self-Help', true),
    (auth.uid(), 'Cal Newport - Deep Work', 'Focus and productivity in a distracted world', 'Productivity', true),
    (auth.uid(), 'David Goggins - Can''t Hurt Me', 'Mental toughness and pushing limits', 'Motivation', true),
    (auth.uid(), 'Jocko Willink - Extreme Ownership', 'Leadership through accountability', 'Leadership', true),
    (auth.uid(), 'Simon Sinek - Start With Why', 'Purpose-driven leadership and communication', 'Leadership', true),
    (auth.uid(), 'Brené Brown - Dare to Lead', 'Courage and vulnerability in leadership', 'Leadership', true),
    (auth.uid(), 'Stephen Covey - 7 Habits', 'Character-based effectiveness principles', 'Self-Help', true),
    (auth.uid(), 'Dale Carnegie - How to Win Friends', 'Human relations and influence', 'Communication', true),
    (auth.uid(), 'Daniel Kahneman - Thinking, Fast and Slow', 'Cognitive biases and decision-making', 'Psychology', true),
    (auth.uid(), 'Nassim Taleb - Antifragile', 'Thriving from chaos and uncertainty', 'Philosophy', true),
    (auth.uid(), 'Robert Greene - 48 Laws of Power', 'Understanding power dynamics', 'Strategy', true),
    (auth.uid(), 'Sun Tzu - Art of War', 'Strategic thinking and conflict resolution', 'Strategy', true),
    (auth.uid(), 'Eckhart Tolle - Power of Now', 'Present moment awareness', 'Spirituality', true),
    (auth.uid(), 'Carol Dweck - Mindset', 'Growth vs fixed mindset psychology', 'Psychology', true),
    (auth.uid(), 'Tim Ferriss - 4-Hour Workweek', 'Lifestyle design and efficiency', 'Business', true),
    (auth.uid(), 'Peter Thiel - Zero to One', 'Innovation and startup thinking', 'Business', true),
    (auth.uid(), 'Ben Horowitz - Hard Thing About Hard Things', 'Real entrepreneurship challenges', 'Business', true),
    (auth.uid(), 'Greg McKeown - Essentialism', 'Disciplined pursuit of less', 'Productivity', true),
    (auth.uid(), 'Robin Sharma - 5 AM Club', 'Morning routines for success', 'Self-Help', true),
    (auth.uid(), 'Malcolm Gladwell - Outliers', 'Success factors and 10,000 hour rule', 'Psychology', true),
    (auth.uid(), 'Charles Duhigg - Power of Habit', 'How habits work and change', 'Psychology', true),
    (auth.uid(), 'Angela Duckworth - Grit', 'Passion and perseverance for long-term goals', 'Psychology', true),
    (auth.uid(), 'Seth Godin - Purple Cow', 'Remarkable marketing and standing out', 'Business', true)
  ON CONFLICT DO NOTHING;

  -- Insert challenges
  INSERT INTO public.challenges (user_id, name, is_active) VALUES
    (auth.uid(), 'Focus on deep work', true),
    (auth.uid(), 'Exercise daily', true),
    (auth.uid(), 'Practice gratitude', true),
    (auth.uid(), 'Read for 30 minutes', true),
    (auth.uid(), 'Limit social media', true)
  ON CONFLICT DO NOTHING;
END;
$$;
