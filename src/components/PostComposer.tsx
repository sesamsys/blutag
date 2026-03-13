import { useState } from "react";
import { Send, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useBlueskyAuth } from "@/contexts/BlueskyAuthContext";
import { compressImageForBluesky } from "@/lib/image-compress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BLUESKY_POST_MAX_LENGTH } from "@/lib/constants";
import type { PhotoFile } from "@/types/photo";

interface PostComposerProps {
  photos: PhotoFile[];
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function PostComposer({ photos }: PostComposerProps) {
  const { session } = useBlueskyAuth();
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [postUrl, setPostUrl] = useState<string | null>(null);

  if (!session) return null;

  const photosWithAltText = photos.filter((p) => p.altText && !p.analyzing);
  if (photosWithAltText.length === 0) return null;

  const handlePost = async () => {
    setPosting(true);
    try {
      // Compress all images client-side
      const images = await Promise.all(
        photosWithAltText.map(async (photo) => {
          const compressed = await compressImageForBluesky(photo.file);
          const base64 = await blobToBase64(compressed);
          return {
            base64,
            mimeType: "image/jpeg",
            altText: photo.altText || "",
          };
        })
      );

      const { data, error } = await supabase.functions.invoke("bsky-post", {
        body: {
          accessJwt: session.accessJwt,
          did: session.did,
          text,
          images,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setPostUrl(data.url);
      toast.success("Posted to Bluesky!");
    } catch (err) {
      console.error("Post failed:", err);
      const message = err instanceof Error ? err.message : "Failed to post";
      toast.error(message);
    } finally {
      setPosting(false);
    }
  };

  const remaining = BLUESKY_POST_MAX_LENGTH - text.length;

  if (postUrl) {
    return (
      <div className="flex flex-col items-center gap-3 p-6 bg-card rounded-2xl border border-border text-center">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Send className="w-5 h-5 text-primary" />
        </div>
        <p className="font-semibold">Posted successfully!</p>
        <a
          href={postUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-primary text-sm underline underline-offset-2"
        >
          View on Bluesky <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 bg-card rounded-2xl border border-border">
      <div className="space-y-1.5">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, BLUESKY_POST_MAX_LENGTH))}
          maxLength={BLUESKY_POST_MAX_LENGTH}
          placeholder="What's on your mind?"
          rows={3}
          className="resize-none rounded-xl"
        />
        <div className="flex items-center justify-between">
          <span
            className={`text-xs ${
              remaining < 20 ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {remaining} characters remaining
          </span>
          <span className="text-xs text-muted-foreground">
            {photosWithAltText.length} photo{photosWithAltText.length !== 1 ? "s" : ""} attached
          </span>
        </div>
      </div>
      <Button
        onClick={handlePost}
        disabled={posting}
        className="w-full gap-2"
      >
        <Send className="w-4 h-4" />
        {posting ? "Posting…" : "Post to Bluesky"}
      </Button>
    </div>
  );
}
