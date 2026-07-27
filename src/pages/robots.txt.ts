import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site, url }) => {
  const sitemapUrl = new URL(
    "sitemap-index.xml",
    site ?? new URL(url.origin),
  ).toString();

  return new Response(
    [
      "User-agent: *",
      "Allow: /",
      `Sitemap: ${sitemapUrl}`,
      "",
    ].join("\n"),
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    },
  );
};
