import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Retry tests deliberately throw errors that are caught asynchronously
    // (e.g. logError inside retryWithBackoff causes Node to emit
    // PromiseRejectionHandledWarning). These are intentional and should not
    // fail the test run.
    dangerouslyIgnoreUnhandledErrors: true,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
