import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-motion": ["framer-motion", "lenis"],
          "vendor-supabase": ["@supabase/supabase-js"],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@app": path.resolve(dirname, "src/app"),
      "@widgets": path.resolve(dirname, "src/widgets"),
      "@features": path.resolve(dirname, "src/features"),
      "@entities": path.resolve(dirname, "src/entities"),
      "@shared": path.resolve(dirname, "src/shared"),
      "@integrations": path.resolve(dirname, "src/integrations"),
    },
  },
});
