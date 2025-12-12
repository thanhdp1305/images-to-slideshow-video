import { defineConfig } from "vite";

export default defineConfig({
  base: './',      // quan trọng để GitHub Pages load assets đúng
  build: {
    outDir: 'docs', // build trực tiếp ra thư mục docs
  },
  optimizeDeps: {
    exclude: [
      "@ffmpeg/ffmpeg",
      "@ffmpeg/core",
      "@ffmpeg/core-mt",
      "@ffmpeg/util"
    ]
  },
  worker: {
    format: "es"
  }
});
