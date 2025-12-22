// lib/seo.ts

const SITE_ORIGIN = "https://airline-fees.com";

export function canonical(path: string): string {
  if (!path.startsWith("/")) return `${SITE_ORIGIN}/${path}`;
  return `${SITE_ORIGIN}${path}`;
}
