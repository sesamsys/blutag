import { useState } from "react";
import { Send, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useBlueskyAuth } from "@/contexts/BlueskyAuthContext";
import { compressImageForBluesky } from "@/lib/image-compress";
import { toast } from "sonner";
import { BLUESKY_POST_MAX_LENGTH } from "@/lib/constants";
import type { PhotoFile } from "@/types/photo";

interface PostComposerProps {
  photos: PhotoFile[];
}

export default function PostComposer({ photos }: PostComposerProps) {
  const { agent, isLoggedIn } = useBlueskyAuth();
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [postUrl, setPostUrl] = useState<string | null>(null);

  if (!isLoggedIn || !agent) return null;

  const photosWithAltText = photos.filter((p) => p.altText && !p.analyzing);
  if (photosWithAltText.length === 0) return null;

  const handlePost = async () => {
    setPosting(true);
    try {
      // Compress and upload all images
      const embeddedImages: Array<{ alt: string; image: any; aspectRatio?: { width: number; height: number } }> = [];

      for (const photo of photosWithAltText) {
        const compressed = await compressImageForBluesky(photo.file);

        // Upload blob via agent
        const response = await agent.uploadBlob(compressed, {
          encoding: "image/jpeg",
        });

        embeddedImages.push({
          alt: photo.altText || "",
          image: response.data.blob,
        });
      }

      // Create the post
      const record: Record<string, unknown> = {
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

      const result = await agent.com.atproto.repo.createRecord({
        repo: agent.did!,
        collection: "app.bsky.feed.post",
        record,
      });

      // Build URL from AT URI
      const atUri = result.data.uri;
      const parts = atUri.replace("at://", "").split("/");
      const url = `https://bsky.app/profile/${parts[0]}/post/${parts[2]}`;

      setPostUrl(url);
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
