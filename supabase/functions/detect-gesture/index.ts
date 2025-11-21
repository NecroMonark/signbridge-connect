import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { frame } = await req.json();
    
    if (!frame) {
      return new Response(
        JSON.stringify({ error: 'No frame provided' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Processing frame for gesture detection');
    
    // TODO: Integrate with external Mediapipe Python service
    // For now, returning mock data for testing
    const mockGestures = ['Hello', 'Thank you', 'Please', 'Good morning', 'I need help'];
    const detectedSign = mockGestures[Math.floor(Math.random() * mockGestures.length)];
    
    return new Response(
      JSON.stringify({ 
        success: true,
        detectedSign,
        confidence: 0.85,
        landmarks: [] // Will contain hand landmark data from Mediapipe
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in detect-gesture function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
