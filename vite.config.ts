import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

// Handle ES Module __dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"), // Allows '@/pages/Foo'
      "@shared": path.resolve(__dirname, "shared"), // For shared logic
      "@assets": path.resolve(__dirname, "attached_assets"), // For image/static files
    },
  },
  root: path.resolve(__dirname, "client"), // Set Vite root
  build: {
    outDir: path.resolve(__dirname, "dist"), // Output directory
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"], // Prevent access to hidden files
    },
  },
});
