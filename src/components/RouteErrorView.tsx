import { useEffect } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getErrorMessage, logError } from "@/lib/error-messages";
import { reportLovableError } from "@/lib/lovable-error-reporting";

interface RouteErrorViewProps {
  error: unknown;
  reset: () => void;
  /** Identifies which boundary caught the error in logs and error reporting. */
  boundary: string;
}

/**
 * Shared fallback for route `errorComponent`s. Logs the technical error,
 * reports it, and shows a user-friendly message with retry / home actions.
 */
export function RouteErrorView({ error, reset, boundary }: RouteErrorViewProps) {
  const router = useRouter();

  useEffect(() => {
    logError(error, { boundary });
    reportLovableError(error, { boundary });
  }, [error, boundary]);

  const handleRetry = () => {
    void router.invalidate();
    reset();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" aria-hidden="true" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">This page didn't load</h1>
          <p className="text-muted-foreground">
            Something went wrong on our side. Please try again.
          </p>
        </div>

        {import.meta.env.DEV && (
          <div className="text-left bg-muted p-4 rounded-lg overflow-auto max-h-48">
            <p className="text-sm font-mono text-destructive">{getErrorMessage(error)}</p>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <Button onClick={handleRetry} className="gap-2 min-h-11">
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Try again
          </Button>
          <Button variant="outline" className="min-h-11" asChild>
            <Link to="/">Go home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
