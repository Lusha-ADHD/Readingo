import { defineConfig } from "astro/config";
import react from "@astrojs/react";

const isDevelopmentServer = process.argv.includes("dev");

export default defineConfig({
  site: "https://readingo.lusha.care",
  base: "/",
  output: "static",
  redirects: {
    "/jeux/bateau": "/jeux/syllabes/",
  },
  devToolbar: {
    enabled: false,
  },
  integrations: [react()],
  vite: {
    // A production build can run while the local server stays open. Keeping
    // separate optimizer caches prevents React's production JSX runtime from
    // replacing the development runtime used by HMR.
    cacheDir: isDevelopmentServer ? "node_modules/.vite-dev" : "node_modules/.vite-build",
  },
});
