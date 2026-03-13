import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { AI_MODEL, SYSTEM_PROMPT, USER_PROMPT_WITH_CONTEXT, USER_PROMPT_DEFAULT } from "./prompts.ts";

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  "http://localhost:5173", // Local development (Vite default)
  "http://localhost:4173", // Local preview
  "http://127.0.0.1:5173", // Local development (alternative)
  "http://127.0.0.1:4173", // Local preview (alternative)
  // Production URLs will be added by Lovable deployment
  // Pattern: https://*.lovableproject.com or custom domain
];

// Get CORS headers based on request origin
function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  
  // Check if origin is allowed
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || 
                    origin.endsWith(".lovableproject.com") ||
                    origin.endsWith(".lovable.app");
  
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400", // 24 hours
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid request: malformed JSON" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { imageBase64, exifData } = body;
    
    // Validate required fields
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid request: imageBase64 is required and must be a string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Validate base64 format (basic check)
    if (!/^[A-Za-z0-9+/=]+$/.test(imageBase64)) {
      return new Response(
        JSON.stringify({ error: "Invalid request: imageBase64 contains invalid characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Validate exifData if provided
    if (exifData !== undefined && exifData !== null && typeof exifData !== "object") {
      return new Response(
        JSON.stringify({ error: "Invalid request: exifData must be an object" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let contextInfo = "";
    if (exifData) {
      if (exifData.dateTime) contextInfo += `Photo taken: ${exifData.dateTime}. `;
      if (exifData.latitude && exifData.longitude) {
        contextInfo += `Photo has GPS data available. `;
      }
    }

    const userContent: Array<
      | { type: "image_url"; image_url: { url: string } }
      | { type: "text"; text: string }
    > = [
      {
        type: "image_url",
        image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
      },
      {
        type: "text",
        text: contextInfo ? USER_PROMPT_WITH_CONTEXT(contextInfo) : USER_PROMPT_DEFAULT,
      },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        temperature: 0,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
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
