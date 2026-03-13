import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, exifData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let contextInfo = "";
    if (exifData) {
      if (exifData.dateTime) contextInfo += `Photo taken: ${exifData.dateTime}. `;
      if (exifData.latitude && exifData.longitude) {
        contextInfo += `GPS coordinates: ${exifData.latitude}, ${exifData.longitude}. `;
      }
      if (exifData.make || exifData.model) {
        contextInfo += `Camera: ${[exifData.make, exifData.model].filter(Boolean).join(" ")}. `;
      }
    }

    const systemPrompt = `You are an expert at writing alternative text (alt text) for images, specifically for use on Bluesky social media. Your alt text helps people with visual impairments understand and enjoy photos.

Guidelines:
- Describe the image clearly and concisely
- Focus on what's most important: subjects, actions, setting, mood
- If EXIF metadata provides date/time or GPS location, use that context naturally (e.g., "taken at sunset" or mentioning a recognizable location)
- Be specific about colors, textures, expressions, and spatial relationships
- Don't start with "A photo of" or "An image of" — just describe what's there
- Maximum 2000 characters
- Write in a natural, descriptive tone that paints a picture with words
- Don't mention technical camera details unless artistically relevant`;

    const userContent: any[] = [
      {
        type: "image_url",
        image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
      },
    ];

    if (contextInfo) {
      userContent.push({
        type: "text",
        text: `Additional context from photo metadata: ${contextInfo}\n\nPlease write alt text for this image.`,
      });
    } else {
      userContent.push({
        type: "text",
        text: "Please write alt text for this image.",
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const altText = data.choices?.[0]?.message?.content?.trim() ?? "";

    return new Response(JSON.stringify({ altText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-photo error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
