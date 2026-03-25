import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://agaraccounting.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/",
          "/banking/",
          "/sales/",
          "/purchases/",
          "/accounting/",
          "/reports/",
          "/inventory/",
          "/documents/",
          "/settings/",
          "/workspaces/",
          "/onboarding/",
          "/accept-invite/",
          "/verify-email/",
          "/reset-password/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
