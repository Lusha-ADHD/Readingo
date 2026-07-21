import { defineConfig } from "astro/config";
import react from "@astrojs/react";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "Readingo";
const owner = process.env.GITHUB_REPOSITORY_OWNER ?? "localhost";

export default defineConfig({
  site: process.env.SITE_URL ?? `https://${owner}.github.io`,
  base: process.env.GITHUB_ACTIONS ? `/${repositoryName}` : "/",
  output: "static",
  integrations: [react()],
});
