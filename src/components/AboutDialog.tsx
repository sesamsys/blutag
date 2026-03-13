import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Info } from "lucide-react";
import { AI_MODEL_DISPLAY_NAME } from "@/lib/constants";
import { metaData } from "@/lib/metaData";

export default function AboutDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
          <Info className="w-3.5 h-3.5" />
          About &amp; Privacy
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>About Blutag</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm text-muted-foreground">
          <section>
            <h3 className="font-semibold text-foreground mb-1">How it works</h3>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                Photos are sent to <span className="font-medium text-foreground">{AI_MODEL_DISPLAY_NAME}</span> (an AI model) to generate descriptive alt text.
              </li>
              <li>
                EXIF metadata (date, location) may be used to improve descriptions, but raw values are never included in the output.
              </li>
              <li>
                Photos are processed in-memory and not stored permanently — they are deleted when your session ends.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-1">Privacy</h3>
            <ul className="list-disc pl-4 space-y-1">
              <li>Photos are not used to train AI models.</li>
              <li>No account is required to generate alt text.</li>
              <li>No personal data is collected or shared with third parties.</li>
              <li>
                Bluesky login (optional, for posting) uses the AT Protocol OAuth flow — Blutag never sees your password.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-1">Open source</h3>
            <p>
              Blutag is open source.{" "}
              <a
                href={metaData.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                View on GitHub →
              </a>
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
