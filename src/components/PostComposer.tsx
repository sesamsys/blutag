import { useState } from "react";
import { Send, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useBlueskyAuth } from "@/contexts/BlueskyAuthContext";
import { BlueskyIcon } from "@/components/icons/BlueskyIcon";
import BlueskyLoginButton from "@/components/BlueskyLoginButton";
import { compressImageForBluesky } from "@/lib/image-compress";
import { toast } from "sonner";
import { BLUESKY_POST_MAX_LENGTH } from "@/lib/constants";
import type { PhotoFile } from "@/types/photo";
import { ERROR_MESSAGES, getErrorMessage, logError, AppError, ErrorType } from "@/lib/error-messages";
import { retryWithBackoff } from "@/lib/retry";

interface PostComposerProps {
  photos: PhotoFile[];
}

export default function PostComposer({ photos }: PostComposerProps) {
  const { agent, isLoggedIn } = useBlueskyAuth();
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [postUrl, setPostUrl] = useState<string | null>(null);

  const photosWithAltText = photos.filter((p) => p.altText && !p.analyzing);
  if (photosWithAltText.length === 0) return null;

  if (!isLoggedIn || !agent) {
    return (
      <div className="flex flex-col items-center gap-3 p-6 bg-card rounded-2xl border border-border text-center">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <BlueskyIcon className="w-5 h-5 text-primary" />
        </div>
        <p className="font-semibold">Post to Bluesky with alt text</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          Sign in to post your photos with the generated alt text directly to Bluesky.
        </p>
        <BlueskyLoginButton />
      </div>
    );
  }

  const handlePost = async () => {
    // Validate post text length
    if (text.length > BLUESKY_POST_MAX_LENGTH) {
      toast.error(`Post text exceeds ${BLUESKY_POST_MAX_LENGTH} character limit`);
      return;
    }
    
    // Validate we have photos with alt text
    if (photosWithAltText.length === 0) {
      toast.error("No photos with alt text to post");
      return;
    }
    
    // Validate alt text lengths
    const invalidAltText = photosWithAltText.find(p => 
      !p.altText || p.altText.length === 0 || p.altText.length > 2000
    );
    if (invalidAltText) {
      toast.error("All photos must have alt text (max 2000 characters)");
      return;
    }
    
    setPosting(true);
    try {
      // Compress and upload all images
      const embeddedImages: Array<{ 
        alt: string; 
        image: { $type: string; ref: { $link: string }; mimeType: string; size: number }; 
        aspectRatio?: { width: number; height: number } 
      }> = [];

      for (const photo of photosWithAltText) {
        try {
          const compressed = await compressImageForBluesky(photo.file);

          // Upload blob with retry
          const response = await retryWithBackoff(
            () => agent.uploadBlob(compressed, { encoding: "image/jpeg" }),
            {
              maxAttempts: 3,
              onRetry: (_error, attempt) => {
                toast.info(`Retrying image upload (attempt ${attempt + 1}/3)...`);
              },
            }
          );

          const blob = response.data.blob;
          embeddedImages.push({
            alt: photo.altText || "",
            image: { $type: "blob", ref: { $link: (blob as any).ref.$link ?? (blob as any).ref.toString() }, mimeType: blob.mimeType, size: blob.size },
          });
        } catch (uploadError) {
          logError(uploadError, { context: "image_upload", photoId: photo.id });
          throw new AppError(
            ERROR_MESSAGES.POST_IMAGE_UPLOAD_FAILED,
            ErrorType.SERVICE,
            uploadError
          );
        }
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

      // Post with retry
      const result = await retryWithBackoff(
        () => agent.com.atproto.repo.createRecord({
          repo: agent.did!,
          collection: "app.bsky.feed.post",
          record,
        }),
        {
          maxAttempts: 3,
          onRetry: (error, attempt) => {
            toast.info(`Retrying post (attempt ${attempt + 1}/3)...`);
          },
        }
      );

      // Build URL from AT URI
      const atUri = result.data.uri;
      const parts = atUri.replace("at://", "").split("/");
      const url = `https://bsky.app/profile/${parts[0]}/post/${parts[2]}`;

      setPostUrl(url);
      toast.success("Posted to Bluesky!");
    } catch (err) {
      logError(err, { context: "bluesky_post", photoCount: photosWithAltText.length });
      
      const errorMessage = getErrorMessage(err);
      toast.error(errorMessage);
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
