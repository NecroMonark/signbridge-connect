import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// TODO: Set this to your deployed Python API URL
const PYTHON_API_URL = Deno.env.get('PYTHON_API_URL') || "http://localhost:8000";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { frame, alphabetMode = false } = await req.json();
    
    if (!frame) {
      return new Response(
        JSON.stringify({ error: 'No frame provided' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Processing frame for gesture detection, alphabetMode:', alphabetMode);
    
    // If Python API is configured, use it for real detection
    if (PYTHON_API_URL && PYTHON_API_URL !== "http://localhost:8000") {
      try {
        const response = await fetch(`${PYTHON_API_URL}/recognize_gesture_base64/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            frame,
            session_id: 'default' // TODO: Use actual session ID from auth
          })
        });

        if (!response.ok) {
          throw new Error(`Python API error: ${response.statusText}`);
        }

        const data = await response.json();
        
        return new Response(
          JSON.stringify(data), 
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } catch (pythonError) {
        console.error('Error calling Python API:', pythonError);
        // Fall through to mock data
      }
    }
    
    // Mock data for testing (when Python API not available)
    if (alphabetMode) {
      const mockLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      const randomLetter = mockLetters[Math.floor(Math.random() * mockLetters.length)];
      const confidence = 0.75 + Math.random() * 0.2; // 0.75-0.95
      
      return new Response(
        JSON.stringify({ 
          gesture: randomLetter,
          confidence,
          stable: confidence > 0.85,
          description: `ASL fingerspelling letter ${randomLetter}`
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      // Phrase mode mock data
      const mockGestures = ['Hello', 'Thank you', 'Please', 'Good morning', 'I need help'];
      const detectedSign = mockGestures[Math.floor(Math.random() * mockGestures.length)];
      
      return new Response(
        JSON.stringify({ 
          success: true,
          detectedSign,
          confidence: 0.85,
          landmarks: []
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
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
