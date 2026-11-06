const args = process.argv.slice(2).filter((argument) => argument !== "--");
const baseUrl = new URL(args[0] ?? "http://127.0.0.1:3000");

async function fetchResponse(path) {
  return fetch(new URL(path, baseUrl), { redirect: "manual" });
}

const sitemapResponse = await fetchResponse("/sitemap.xml");
if (!sitemapResponse.ok) throw new Error(`Unable to load sitemap: ${sitemapResponse.status}`);

const sitemap = await sitemapResponse.text();
const pagePaths = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(
  (match) => new URL(match[1]).pathname,
);
const linkedFrom = new Map();

for (const pagePath of pagePaths) {
  const response = await fetchResponse(pagePath);
  if (!response.ok) throw new Error(`${pagePath} returned ${response.status}`);
  const html = await response.text();

  for (const match of html.matchAll(/\bhref=(["'])(.*?)\1/gi)) {
    const href = match[2];
    if (!href.startsWith("/") || href.startsWith("//") || href.startsWith("/_next/")) continue;
    const path = new URL(href, baseUrl).pathname;
    const sources = linkedFrom.get(path) ?? new Set();
    sources.add(pagePath);
    linkedFrom.set(path, sources);
  }
}

const broken = [];
for (const [path, sources] of linkedFrom) {
  const response = await fetchResponse(path);
  if (response.status < 200 || response.status >= 400) {
    broken.push({ path, status: response.status, sources: [...sources] });
  }
}

console.log(`Audited ${pagePaths.length} sitemap pages and ${linkedFrom.size} internal paths.`);
if (broken.length) {
  console.error("Broken internal links:");
  for (const item of broken) {
    console.error(`- ${item.path}: ${item.status} (linked from ${item.sources.join(", ")})`);
  }
  process.exitCode = 1;
} else {
  console.log("All internal paths returned a successful response or redirect.");
}
