import { useState } from "react";
import { LogIn, LogOut } from "lucide-react";
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
  const { session, isLoggedIn, isLoggingIn, login, logout } = useBlueskyAuth();
  const [open, setOpen] = useState(false);
  const [handle, setHandle] = useState("");
  const [appPassword, setAppPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(handle, appPassword);
      setOpen(false);
      setHandle("");
      setAppPassword("");
    } catch {
      // error already toasted
    }
  };

  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground truncate max-w-[140px]">
          @{session!.handle}
        </span>
        <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5">
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Log out</span>
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5">
        <LogIn className="w-4 h-4" />
        <span className="hidden sm:inline">Log in to Bluesky</span>
        <span className="sm:hidden">Log in</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Log in to Bluesky</DialogTitle>
            <DialogDescription>
              Use an{" "}
              <a
                href="https://bsky.app/settings/app-passwords"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2"
              >
                App Password
              </a>{" "}
              — not your main password. App Passwords keep your account secure.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="bsky-handle">Handle</Label>
              <Input
                id="bsky-handle"
                placeholder="you.bsky.social"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bsky-password">App Password</Label>
              <Input
                id="bsky-password"
                type="password"
                placeholder="xxxx-xxxx-xxxx-xxxx"
                value={appPassword}
                onChange={(e) => setAppPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" disabled={isLoggingIn} className="w-full">
              {isLoggingIn ? "Logging in…" : "Log in"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
