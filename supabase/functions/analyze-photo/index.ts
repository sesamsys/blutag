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

    const systemPrompt = `You are an expert at writing alternative text (alt text) for images, specifically for use on Bluesky social media. The photographer is posting their own photos — they know what's in them. Your job is to describe the image for people who cannot see it.

Accuracy:
- State what is clearly visible. Do NOT speculate or infer things that aren't obvious (e.g., don't guess the season from grass color, don't infer mood from ambiguous expressions).
- If EXIF metadata provides the date/time or location context, use that as ground truth rather than guessing from visual clues. But do NOT include raw metadata values (coordinates, timestamps) in the alt text.
- Do NOT include precise location information such as coordinates, street names, or exact addresses.
- Only mention time of day or weather if it's visually dominant (e.g., "at sunset with orange sky", "in heavy rain"). Don't mention it if it's just incidental.

Conciseness:
- Focus on the main subject and what's happening. Skip minor background details like ground texture, scattered objects, or incidental elements.
- Write 1-2 sentences for simple images, up to 3 for complex scenes. Maximum 2000 characters.
- Don't start with "A photo of" or "An image of" — just describe what's there.
- Don't describe things the poster already knows and that don't help a visually impaired reader (e.g., exact color of grass, type of pavement).
- Don't mention technical camera details or metadata.

Completeness:
- Capture the primary subject, action, and general setting.
- Mention the number of people or key objects when it matters.
- Note any prominent readable text, signs, or logos.

Accessibility best practices:
- Write naturally, as if briefly telling someone what they'd see.
- Use plain language — no jargon or overly descriptive prose.
- For people, describe actions and context, not assumptions about identity or characteristics.
- Describe atmosphere only when it's a defining feature of the image.`;

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
