import type { ReactNode } from "react";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RouteErrorView } from "@/components/RouteErrorView";
import { BlueskyAuthProvider } from "@/contexts/BlueskyAuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import NotFound from "@/pages/NotFound";
import appCss from "../styles.css?url";

const SITE_TITLE = "Blutag — AI Alt Text for Bluesky";
const SITE_DESCRIPTION =
  "Generate meaningful alt text for your Bluesky photos using AI. Make your posts accessible to everyone.";
const SOCIAL_IMAGE =
  "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6155f3df-391f-4549-861b-23ce813ebcea/id-preview-53d73eba--9c2eda88-df4c-4dad-a4b4-ddefaebf6d48.lovable.app-1773390902835.png";

/**
 * Applies the system colour scheme before first paint and keeps it in sync,
 * so dark-mode users never see a white flash. Runs as an inline head script
 * (not an effect) because effects only run after hydration.
 */
const THEME_BOOTSTRAP_SCRIPT = `(function(){var q=window.matchMedia('(prefers-color-scheme: dark)');document.documentElement.classList.toggle('dark',q.matches);q.addEventListener('change',function(e){document.documentElement.classList.toggle('dark',e.matches)});})();`;

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: SITE_TITLE },
      { name: "description", content: SITE_DESCRIPTION },
      { name: "author", content: "Blutag" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: SITE_TITLE },
      { property: "og:description", content: SITE_DESCRIPTION },
      { property: "og:image", content: SOCIAL_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: SITE_TITLE },
      { name: "twitter:description", content: SITE_DESCRIPTION },
      { name: "twitter:image", content: SOCIAL_IMAGE },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      {
        rel: "preload",
        href: "/fonts/inter-latin.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
    ],
    scripts: [{ children: THEME_BOOTSTRAP_SCRIPT }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: ({ error, reset }) => (
    <RouteErrorView error={error} reset={reset} boundary="tanstack_root_error_component" />
  ),
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: the theme script adds `class="dark"` before hydration.
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <BlueskyAuthProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Outlet />
          </TooltipProvider>
        </LanguageProvider>
      </BlueskyAuthProvider>
    </QueryClientProvider>
  );
}
