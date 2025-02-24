import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        content: path.resolve(__dirname, "src/content.js"),
        background: path.resolve(__dirname, "src/background.js"),
        
      },
      output: {
        entryFileNames: "[name].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name == 'content.css')
            return 'assets/styles.css';
          return assetInfo.name;
        }, // Ensure CSS is output correctly
      },
    },
  },
  publicDir: "public", // Ensure the public directory is included
});