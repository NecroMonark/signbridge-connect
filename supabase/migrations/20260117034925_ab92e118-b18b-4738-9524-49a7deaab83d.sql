-- Create gesture_logs table for storing all detected gestures
CREATE TABLE public.gesture_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  detected_gesture TEXT NOT NULL,
  confidence FLOAT NOT NULL DEFAULT 0,
  is_stable BOOLEAN DEFAULT false,
  mode TEXT CHECK (mode IN ('alphabet', 'phrase')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create translation_history table for tracking translations
CREATE TABLE public.translation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,
  original_text TEXT NOT NULL,
  source_language TEXT NOT NULL DEFAULT 'asl',
  target_language TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_sessions table for tracking active sessions
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT UNIQUE NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  last_active_at TIMESTAMPTZ DEFAULT now(),
  total_gestures_detected INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Create indexes for performance
CREATE INDEX idx_gesture_logs_session ON public.gesture_logs(session_id);
CREATE INDEX idx_gesture_logs_created ON public.gesture_logs(created_at DESC);
CREATE INDEX idx_translation_history_session ON public.translation_history(session_id);
CREATE INDEX idx_user_sessions_token ON public.user_sessions(session_token);

-- Enable Row Level Security
ALTER TABLE public.gesture_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Public access policies for gesture_logs (public tool, no auth required)
CREATE POLICY "Allow public insert on gesture_logs" ON public.gesture_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on gesture_logs" ON public.gesture_logs FOR SELECT USING (true);

-- Public access policies for translation_history
CREATE POLICY "Allow public insert on translation_history" ON public.translation_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on translation_history" ON public.translation_history FOR SELECT USING (true);

-- Public access policies for user_sessions
CREATE POLICY "Allow public all on user_sessions" ON public.user_sessions FOR ALL USING (true) WITH CHECK (true);