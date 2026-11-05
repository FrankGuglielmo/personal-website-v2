import type { Metadata } from "next";

export const siteUrl = "https://frankguglielmo.com";
export const siteName = "Frank Guglielmo";
export const siteTitle = "Frank Guglielmo — Forward Deployed Engineer";

/** First sentence of the homepage hero. */
export const heroLead =
  "I'm a hands-on Forward Deployed Engineer and app developer, continually exploring ways to create and share impactful ideas through technology.";

/** Second sentence of the homepage hero. */
export const heroSupport =
  "My work revolves around building systems and apps that unite people in meaningful ways.";

export const siteDescription = heroLead;

export const socialProfiles = [
  "https://github.com/FrankGuglielmo",
  "https://app.joinhandshake.com/profiles/frank",
  "https://www.linkedin.com/in/fdguglielmo/",
] as const;

export const ogImage = {
  url: "/images/headshot-no-bg.png",
  width: 1161,
  height: 1131,
  alt: "Frank Guglielmo",
} as const;

/** Public routes that should be indexed. Playground is omitted. */
export const indexablePaths = [
  "/",
  "/terms",
  "/Atom/support",
  "/Atom/privacy",
  "/Librario/support",
  "/Librario/privacy",
] as const;

export function absoluteUrl(path: string): string {
  if (path === "/") return siteUrl;
  return `${siteUrl}${path}`;
}

export function pageMetadata({
  title,
  description,
  path,
  index = true,
}: {
  title: string;
  description: string;
  /** Path beginning with "/", or "/" for the homepage. */
  path: string;
  index?: boolean;
}): Metadata {
  const isHome = path === "/";
  const canonical = absoluteUrl(path);
  const fullTitle = isHome ? siteTitle : `${title} · ${siteName}`;

  return {
    title: isHome ? { absolute: fullTitle } : title,
    description,
    alternates: { canonical },
    robots: index
      ? { index: true, follow: true }
      : { index: false, follow: false, nocache: true },
    openGraph: {
      type: "website",
      url: canonical,
      siteName,
      title: fullTitle,
      description,
      images: [ogImage],
    },
    twitter: {
      card: "summary",
      title: fullTitle,
      description,
      images: [ogImage.url],
    },
  };
}
