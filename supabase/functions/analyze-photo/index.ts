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
        contextInfo += `Photo has GPS data available. `;
      }
    }

    const systemPrompt = `You are an expert at writing alternative text (alt text) for images, specifically for use on Bluesky social media. Your alt text helps people with visual impairments understand and enjoy photos.

Accuracy:
- Describe only what is actually visible in the image. Never guess, assume, or fabricate details.
- Identify subjects, objects, and actions correctly. If something is ambiguous, describe it neutrally rather than speculating.
- Do NOT include precise location information such as coordinates, street names, or exact addresses.
- Do NOT include exact times of day. Only mention time or weather conditions if they are visually significant and affect the mood or understanding of the image (e.g., "at dusk with golden light", "during a heavy snowstorm").

Completeness:
- Capture the primary subject, the action or mood, and the general setting.
- Include relevant visual details that convey meaning: colors, spatial relationships, expressions, text visible in the image.
- Mention the number of people or key objects when it matters for understanding.
- Note any text, signs, or logos that are prominent and readable.

Conciseness:
- Focus on what matters most. Omit minor background details that don't contribute to understanding.
- Don't start with "A photo of" or "An image of" — just describe what's there.
- Maximum 2000 characters, but aim for brevity — most alt text should be 1-3 sentences.
- Don't mention technical camera details or metadata.

Accessibility best practices:
- Write in a natural, descriptive tone as if explaining the image to someone who cannot see it.
- Use plain language — avoid jargon, abbreviations, or overly technical terms.
- Describe the emotional tone or atmosphere when it's a key part of the image.
- For images with people, describe actions and context rather than making assumptions about identity, ethnicity, or personal characteristics.
- Ensure the description is useful on its own without requiring additional context.`;

    const userContent: any[] = [
      {
        type: "image_url",
        image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
      },
    ];

    if (contextInfo) {
      userContent.push({
        type: "text",
        text: `Additional context from photo metadata: ${contextInfo}\n\nPlease write concise alt text for this image, focusing on the main theme.`,
      });
    } else {
      userContent.push({
        type: "text",
        text: "Please write concise alt text for this image, focusing on the main theme.",
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
