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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate unique session token
    const sessionToken = crypto.randomUUID();
    
    console.log('Creating new session:', sessionToken);

    // Insert session into database
    const { data, error } = await supabase
      .from('user_sessions')
      .insert({
        session_token: sessionToken,
        started_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
        total_gestures_detected: 0,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      throw error;
    }

    console.log('Session created successfully:', data.id);

    return new Response(
      JSON.stringify({
        success: true,
        session_id: data.id,
        session_token: data.session_token,
        created_at: data.started_at
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-session function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
