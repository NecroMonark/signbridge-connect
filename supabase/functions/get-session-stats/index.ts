import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('session_id');

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'session_id query parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Fetching stats for session:', sessionId);

    // Get session info
    const { data: sessionData, error: sessionError } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (sessionError) {
      console.error('Error fetching session:', sessionError);
      throw sessionError;
    }

    // Get recent gesture logs for this session
    const { data: gestureLogs, error: logsError } = await supabase
      .from('gesture_logs')
      .select('detected_gesture, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (logsError) {
      console.error('Error fetching gesture logs:', logsError);
      throw logsError;
    }

    // Calculate session duration in minutes
    let sessionDurationMinutes = 0;
    if (sessionData?.started_at) {
      const startTime = new Date(sessionData.started_at).getTime();
      const lastActive = sessionData.last_active_at 
        ? new Date(sessionData.last_active_at).getTime() 
        : Date.now();
      sessionDurationMinutes = Math.round((lastActive - startTime) / (1000 * 60));
    }

    // Extract recent letters
    const recentLetters = gestureLogs?.map(log => log.detected_gesture) || [];

    const stats = {
      session_id: sessionId,
      total_gestures: sessionData?.total_gestures_detected || 0,
      recent_letters: recentLetters,
      started_at: sessionData?.started_at || null,
      last_active_at: sessionData?.last_active_at || null,
      session_duration_minutes: sessionDurationMinutes,
      is_active: sessionData?.is_active || false
    };

    console.log('Session stats:', stats);

    return new Response(
      JSON.stringify(stats),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-session-stats function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
