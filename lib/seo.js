/**
 * Builds the per-request SEO model (meta, Open Graph, Twitter, JSON-LD) from a
 * page's inputs and the global SEO settings.
 */

const config = require("../config/config");

function baseUrl(req) {
  const configured = config.seo.baseUrl;
  if (configured) return configured;
  return `${req.protocol}://${req.get("host")}`;
}

function absoluteUrl(req, pathOrUrl) {
  if (!pathOrUrl) return "";
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = baseUrl(req);
  return `${base}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

function truncate(text, max = 160) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).replace(/\s+\S*$/, "").trim() + "…";
}

function buildSeo({
  req,
  path,
  title,
  description,
  image,
  type = "website",
  product,
  breadcrumbs,
  noindex = false,
}) {
  const siteName = config.site.siteTitle;
  const resolvedTitle = title || siteName;

  const resolvedDescription = truncate(
    description || config.seo.defaultDescription || "",
  );

  const canonical = absoluteUrl(req, path);

  const rawImage =
    image || config.seo.ogImage || config.site.defaultThumbnail || "";
  const ogImage = rawImage ? absoluteUrl(req, rawImage) : "";

  const robots =
    noindex || config.seo.discourage ? "noindex,nofollow" : "index,follow";

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteName,
      url: baseUrl(req),
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: siteName,
      url: baseUrl(req),
      ...(ogImage ? { logo: ogImage } : {}),
    },
  ];

  if (product) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      ...(ogImage ? { image: ogImage } : {}),
      description: resolvedDescription,
      offers: {
        "@type": "Offer",
        price: String(product.price),
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        url: canonical,
      },
    });
  }

  if (breadcrumbs && breadcrumbs.length) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.name,
        item: absoluteUrl(req, c.url),
      })),
    });
  }

  return {
    title: resolvedTitle,
    description: resolvedDescription,
    canonical,
    ogImage,
    type,
    siteName,
    robots,
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      site: config.seo.twitterHandle,
    },
    jsonLd,
  };
}

module.exports = { baseUrl, absoluteUrl, truncate, buildSeo };
