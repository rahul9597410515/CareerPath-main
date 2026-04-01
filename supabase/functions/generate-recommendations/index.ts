// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    
    // Client for user authentication and reading user data
    const supabaseUser = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Admin client for inserting recommendations (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    // Fetch user's skills
    const { data: skills } = await supabaseUser
      .from("skills")
      .select("skill_name, proficiency_level, category")
      .eq("user_id", user.id);

    // Fetch user's goals
    const { data: goals } = await supabaseUser
      .from("career_goals")
      .select("goal_title, goal_description, target_role, timeline, status")
      .eq("user_id", user.id);

    // Fetch user's profile
    const { data: profile } = await supabaseUser
      .from("profiles")
      .select("position, department")
      .eq("user_id", user.id)
      .single();

    // Generate AI recommendations
    const prompt = `Based on the following employee profile, generate 3-5 personalized career development recommendations.

Current Position: ${profile?.position || "Not specified"}
Department: ${profile?.department || "Not specified"}

Skills:
${skills?.map(s => `- ${s.skill_name} (${s.proficiency_level}${s.category ? `, ${s.category}` : ""})`).join("\n") || "No skills listed"}

Career Goals:
${goals?.map(g => `- ${g.goal_title}: ${g.goal_description || "No description"} (Target: ${g.target_role || "Not specified"}, Timeline: ${g.timeline || "Not specified"})`).join("\n") || "No goals listed"}

Generate recommendations in the following categories ONLY: skill, training, career_path.

For each recommendation, provide:
1. A clear, actionable title (max 100 chars)
2. A detailed description explaining why this recommendation matters and how to act on it (max 300 chars)
3. A category (MUST be one of: skill, training, career_path)
4. A priority level (MUST be one of: low, medium, high)
5. A specific course or resource name that would help achieve this recommendation
6. The provider/platform (e.g., Coursera, Udemy, LinkedIn Learning, edX, Pluralsight)
7. Estimated duration (e.g., "4 weeks", "20 hours", "3 months")
8. A realistic URL to the course/resource (use actual platform URLs like https://www.coursera.org/, https://www.udemy.com/, https://www.linkedin.com/learning/)

CRITICAL: The recommendation_type field MUST be exactly one of these values: "skill", "training", "career_path"

Format your response as a JSON array of objects with these exact fields: title, description, recommendation_type, priority, course_name, provider, duration, source_url`;

    let recommendations: any[] = [];

    if (lovableApiKey && lovableApiKey !== "undefined" && lovableApiKey.length > 0) {
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are a career development AI assistant with knowledge of online learning platforms. Generate practical recommendations with real course links from platforms like Coursera, Udemy, LinkedIn Learning, edX, Pluralsight. Always respond with valid JSON arrays only, no markdown formatting." },
            { role: "user", content: prompt }
          ],
        }),
      });

      if (!aiResponse.ok) {
        if (aiResponse.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (aiResponse.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI gateway error: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      let recommendationsText = aiData.choices[0].message.content;

      // Clean up markdown code blocks if present
      recommendationsText = recommendationsText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      recommendations = JSON.parse(recommendationsText);
    } else {
      // Fallback mock recommendations if API key is missing
      recommendations = [
        {
          title: "Improve Tech Leadership",
          description: "Enhance your ability to lead engineering teams and communicate effectively with stakeholders.",
          recommendation_type: "career_path",
          priority: "high",
          course_name: "Engineering Leadership Fundamentals",
          provider: "Coursera",
          duration: "4 weeks",
          source_url: "https://www.coursera.org/"
        },
        {
          title: "Advanced System Architecture",
          description: "Master high-level architecture planning for scalable and robust web applications.",
          recommendation_type: "skill",
          priority: "medium",
          course_name: "Grokking Modern System Design",
          provider: "Educative",
          duration: "20 hours",
          source_url: "https://www.educative.io/"
        },
        {
          title: "AI & Machine Learning Basics",
          description: "Learn the fundamentals of integrating AI endpoints and LLMs into modern products.",
          recommendation_type: "training",
          priority: "medium",
          course_name: "AI for Everyone",
          provider: "Coursera",
          duration: "2 weeks",
          source_url: "https://www.coursera.org/"
        }
      ];
    }

    // Insert recommendations into database using admin client (bypasses RLS)
    const recommendationsToInsert = recommendations.map((rec: any) => ({
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

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ success: true, count: recommendations.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating recommendations:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate recommendations" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
