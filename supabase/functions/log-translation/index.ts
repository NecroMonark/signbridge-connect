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
    const { session_id, original_text, source_language, target_language, translated_text } = await req.json();

    if (!original_text || !target_language || !translated_text) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: original_text, target_language, translated_text' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Logging translation:', { session_id, original_text, target_language });

    // Insert translation record
    const { data, error } = await supabase
      .from('translation_history')
      .insert({
        session_id: session_id || null,
        original_text,
        source_language: source_language || 'asl',
        target_language,
        translated_text
      })
      .select()
      .single();

    if (error) {
      console.error('Error logging translation:', error);
      throw error;
    }

    console.log('Translation logged successfully:', data.id);

    return new Response(
      JSON.stringify({
        success: true,
        id: data.id,
        created_at: data.created_at
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in log-translation function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
