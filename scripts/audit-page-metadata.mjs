const args = process.argv.slice(2).filter((argument) => argument !== "--");
const baseUrl = new URL(args[0] ?? "http://127.0.0.1:3000");
const publicOrigin = (args[1] ?? "https://airline-fees.com").replace(/\/$/, "");

function attributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/g)].map((match) => [
      match[1].toLowerCase(),
      match[3],
    ]),
  );
}

function metadataFromHtml(html) {
  const tags = html.match(/<(?:link|meta)\b[^>]*>/gi) ?? [];
  let canonical = "";
  let description = "";

  for (const tag of tags) {
    const attrs = attributes(tag);
    if (attrs.rel?.toLowerCase() === "canonical") canonical = attrs.href ?? "";
    if (attrs.name?.toLowerCase() === "description") description = attrs.content ?? "";
  }

  return { canonical, description };
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.text();
}

const sitemap = await fetchText(new URL("/sitemap.xml", baseUrl));
const paths = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => new URL(match[1]).pathname);
const pages = [];

for (const path of paths) {
  const html = await fetchText(new URL(path, baseUrl));
  const metadata = metadataFromHtml(html);
  const expectedCanonical = `${publicOrigin}${path}`;
  pages.push({ path, expectedCanonical, ...metadata });
}

const badCanonicals = pages.filter((page) => page.canonical !== page.expectedCanonical);
const missingDescriptions = pages.filter((page) => !page.description.trim());
const descriptions = Map.groupBy(pages, (page) => page.description.trim());
const duplicateDescriptions = [...descriptions.entries()]
  .filter(([description, matches]) => description && matches.length > 1)
  .map(([description, matches]) => ({
    description,
    paths: matches.map((page) => page.path),
  }));

console.log(`Audited ${pages.length} sitemap pages.`);

if (badCanonicals.length) {
  console.error("\nIncorrect or missing canonicals:");
  for (const page of badCanonicals) {
    console.error(`- ${page.path}: ${page.canonical || "(missing)"} (expected ${page.expectedCanonical})`);
  }
}

if (missingDescriptions.length) {
  console.error("\nMissing descriptions:");
  for (const page of missingDescriptions) console.error(`- ${page.path}`);
}

if (duplicateDescriptions.length) {
  console.error("\nDuplicate descriptions:");
  for (const group of duplicateDescriptions) {
    console.error(`- ${group.paths.join(", ")}`);
  }
}

if (badCanonicals.length || missingDescriptions.length || duplicateDescriptions.length) {
  process.exitCode = 1;
} else {
  console.log("All sitemap pages have self-referencing canonicals and unique, non-empty descriptions.");
}
