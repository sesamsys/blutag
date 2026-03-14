import { useState, useMemo } from "react";
import { LogIn, LogOut, Loader2 } from "lucide-react";
import { useBlueskyAuth } from "@/contexts/BlueskyAuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function isValidHandle(value: string): boolean {
  const trimmed = value.trim();
  return (
    trimmed.length >= 3 &&
    trimmed.includes(".") &&
    !trimmed.includes("@") &&
    !trimmed.includes(" ")
  );
}

export default function BlueskyLoginButton() {
  const { handle, isLoggedIn, isLoading, signIn, logout } = useBlueskyAuth();
  const [open, setOpen] = useState(false);
  const [inputHandle, setInputHandle] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  const trimmed = inputHandle.trim();
  const valid = useMemo(() => isValidHandle(trimmed), [trimmed]);
  const showHint = trimmed.length > 0 && !valid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setSigningIn(true);
    try {
      await signIn(trimmed);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Sign-in failed. Please try again.";
      toast.error(msg);
      setSigningIn(false);
    }
  };

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled className="gap-1.5">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="hidden sm:inline">Loading…</span>
      </Button>
    );
  }

  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-2">
        <a
          href={`https://bsky.app/profile/${handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground truncate max-w-[160px] transition-colors"
        >
          <BlueskyIcon className="w-3.5 h-3.5 shrink-0" />
          @{handle}
        </a>
        <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5">
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5">
        <LogIn className="w-4 h-4" />
        <span className="hidden sm:inline">Sign in with Bluesky</span>
        <span className="sm:hidden">Sign in</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Sign in with Bluesky</DialogTitle>
            <DialogDescription>
              Enter your Bluesky handle to sign in securely via OAuth.
              You'll be redirected to Bluesky to approve access.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="bsky-handle">Handle</Label>
              <Input
                id="bsky-handle"
                placeholder="you.bsky.social"
                value={inputHandle}
                onChange={(e) => setInputHandle(e.target.value)}
                required
                autoComplete="username"
                disabled={signingIn}
              />
              {showHint && (
                <p className="text-sm text-destructive">
                  {trimmed.includes("@")
                    ? "Enter a handle, not an email (e.g. alice.bsky.social)"
                    : "Enter a handle like alice.bsky.social"}
                </p>
              )}
            </div>
            <Button type="submit" disabled={signingIn || !valid} className="w-full gap-2">
              {signingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Redirecting…
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign in with Bluesky
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
