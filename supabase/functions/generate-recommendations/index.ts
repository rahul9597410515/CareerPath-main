// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing SUPABASE env vars.");
    }

    let authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("Missing auth header.");
    }
    
    const token = authHeader.replace("Bearer ", "");
    
    const supabaseUser = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized: " + JSON.stringify(userError));

    let recommendations = [
      {
        title: "Improve Tech Leadership",
        description: "Enhance your ability to lead engineering teams and communicate effectively with stakeholders.",
        recommendation_type: "career_path",
        priority: "high",
        status: "pending"
      },
      {
        title: "Advanced System Architecture",
        description: "Master high-level architecture planning for scalable and robust web applications.",
        recommendation_type: "skill",
        priority: "medium",
        status: "pending"
      },
      {
        title: "AI & Machine Learning Basics",
        description: "Learn the fundamentals of integrating AI endpoints and LLMs into modern products.",
        recommendation_type: "training",
        priority: "medium",
        status: "pending"
      }
    ];

    const recommendationsToInsert = recommendations.map((rec) => ({
      user_id: user.id,
      title: rec.title,
      description: rec.description,
      recommendation_type: rec.recommendation_type,
      priority: rec.priority,
      status: "pending"
    }));

    const { error: insertError } = await supabaseAdmin
      .from("recommendations")
      .insert(recommendationsToInsert);

    if (insertError) throw new Error("Insert DB Error: " + JSON.stringify(insertError));

    return new Response(
      JSON.stringify({ success: true, count: recommendations.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Critical Function Error: ", error);
    // Return 200 code so the frontend actually displays the raw error text on the screen for debugging
    return new Response(
      JSON.stringify({ success: true, count: "ERROR: " + (error instanceof Error ? error.stack || error.message : JSON.stringify(error)) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
