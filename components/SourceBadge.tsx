// components/SourceBadge.tsx

function safeHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "source";
  }
}

export function SourceBadge({ url }: { url: string }) {
  const host = safeHost(url);
  return (
    <a href={url} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>
      Source ({host})
    </a>
  );
}
