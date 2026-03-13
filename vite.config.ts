import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          
          // AT Protocol and OAuth (large dependencies)
          "atproto": ["@atproto/api", "@atproto/oauth-client-browser"],
          
          // Data fetching and state management
          "data-libs": ["@tanstack/react-query", "@supabase/supabase-js"],
          
          // Image processing
          "image-libs": ["exifreader"],
          
          // Form handling
          "forms": ["react-hook-form", "@hookform/resolvers", "zod"],
          
          // Icons
          "icons": ["lucide-react"],
        },
      },
    },
    // Increase chunk size warning limit to 1000 kB
    chunkSizeWarningLimit: 1000,
  },
}));
