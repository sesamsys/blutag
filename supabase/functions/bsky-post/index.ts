import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BSKY_API = "https://bsky.social/xrpc";

interface ImagePayload {
  base64: string;
  mimeType: string;
  altText: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accessJwt, did, text, images } = await req.json() as {
      accessJwt: string;
      did: string;
      text: string;
      images: ImagePayload[];
    };

    if (!accessJwt || !did) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upload each image blob
    const embeddedImages: Array<{ alt: string; image: any }> = [];

    for (const img of images) {
      const binaryData = Uint8Array.from(atob(img.base64), (c) => c.charCodeAt(0));

      const uploadRes = await fetch(`${BSKY_API}/com.atproto.repo.uploadBlob`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessJwt}`,
          "Content-Type": img.mimeType,
        },
        body: binaryData,
      });

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        console.error("uploadBlob failed:", uploadRes.status, errText);
        throw new Error(`Image upload failed (${uploadRes.status})`);
      }

      const uploadData = await uploadRes.json();
      embeddedImages.push({
        alt: img.altText || "",
        image: uploadData.blob,
      });
    }

    // Create the post record
    const record: any = {
      $type: "app.bsky.feed.post",
      text: text || "",
      createdAt: new Date().toISOString(),
    };

    if (embeddedImages.length > 0) {
      record.embed = {
        $type: "app.bsky.embed.images",
        images: embeddedImages,
      };
    }

    const createRes = await fetch(`${BSKY_API}/com.atproto.repo.createRecord`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessJwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        repo: did,
        collection: "app.bsky.feed.post",
        record,
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error("createRecord failed:", createRes.status, errText);
      throw new Error(`Post creation failed (${createRes.status})`);
    }

    const createData = await createRes.json();

    // Build Bluesky web URL from AT URI
    // at://did:plc:xxx/app.bsky.feed.post/rkey → https://bsky.app/profile/did:plc:xxx/post/rkey
    const atUri = createData.uri as string;
    const parts = atUri.replace("at://", "").split("/");
    const postUrl = `https://bsky.app/profile/${parts[0]}/post/${parts[2]}`;

    return new Response(
      JSON.stringify({ uri: createData.uri, cid: createData.cid, url: postUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("bsky-post error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
