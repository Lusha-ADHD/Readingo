import { defineConfig } from "astro/config";
import react from "@astrojs/react";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "Readingo";
const owner = process.env.GITHUB_REPOSITORY_OWNER ?? "localhost";
const isDevelopmentServer = process.argv.includes("dev");

export default defineConfig({
  site: process.env.SITE_URL ?? `https://${owner}.github.io`,
  base: process.env.GITHUB_ACTIONS ? `/${repositoryName}` : "/",
  output: "static",
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
