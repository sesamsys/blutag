import { useEffect } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { logError } from "@/lib/error-messages";

const NotFound = () => {
  const pathname = useLocation({ select: (location) => location.pathname });

  useEffect(() => {
    logError(new Error("404: route not found"), { pathname });
  }, [pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">
          Oops! Page not found
        </p>
        <Link
          to="/"
          className="inline-flex min-h-11 items-center text-primary underline hover:text-primary/90"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
