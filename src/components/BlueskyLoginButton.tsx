import { useState } from "react";
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

export default function BlueskyLoginButton() {
  const { handle, isLoggedIn, isLoading, signIn, logout } = useBlueskyAuth();
  const [open, setOpen] = useState(false);
  const [inputHandle, setInputHandle] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputHandle.trim()) return;
    setSigningIn(true);
    try {
      await signIn(inputHandle.trim());
      // Redirects away — won't reach here
    } catch (err) {
      console.error("Sign in error:", err);
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
        <span className="text-sm text-muted-foreground truncate max-w-[140px]">
          @{handle}
        </span>
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
            </div>
            <Button type="submit" disabled={signingIn} className="w-full gap-2">
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
