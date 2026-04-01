// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    const systemPrompt = `You are a helpful HR assistant chatbot specializing in employee skill development and career growth. 
    You provide guidance on:
    - Skill development paths and recommendations
    - Training opportunities and courses
    - Career progression advice
    - Goal setting and achievement strategies
    - Performance improvement tips
    
    Keep responses concise, friendly, and actionable. Use the employee context provided when available.
    ${context ? `\n\nEmployee Context: ${JSON.stringify(context)}` : ''}`;

    let reply = "I am currently running in offline mode because my connection to the AI gateway is bypassed for local deployment. But I'm still here to tell you that you're doing great with your career goals and I highly recommend you check out the mock training courses in your AI recommendations tab!";

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Chatbot error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
