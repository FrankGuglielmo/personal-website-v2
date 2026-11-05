import type { MetadataRoute } from "next";
import { absoluteUrl, indexablePaths } from "@/data/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return indexablePaths.map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: path === "/" ? "monthly" : "yearly",
    priority: path === "/" ? 1 : 0.4,
  }));
}
