import type { MetadataRoute } from "next";
import { SEED } from "@/lib/seed";
import { ACTIVITY_LIST } from "@/lib/types";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://haarchion.example";
  const now = new Date();

  return [
    { url: `${base}/`, lastModified: now },
    { url: `${base}/people`, lastModified: now },
    { url: `${base}/productions`, lastModified: now },
    { url: `${base}/categories`, lastModified: now },
    { url: `${base}/search`, lastModified: now },
    { url: `${base}/me`, lastModified: now },
    ...ACTIVITY_LIST.map((slug) => ({
      url: `${base}/categories/${slug}`,
      lastModified: now,
    })),
    ...SEED.people.map((person) => ({
      url: `${base}/people/${person.id}`,
      lastModified: now,
    })),
    ...SEED.productions.map((production) => ({
      url: `${base}/productions/${production.id}`,
      lastModified: now,
    })),
  ];
}
