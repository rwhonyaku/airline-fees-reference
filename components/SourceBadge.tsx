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
    <a 
      href={url} 
      target="_blank" 
      rel="noreferrer" 
      className="text-blue-600 hover:text-blue-800 font-medium underline underline-offset-4 decoration-slate-200 hover:decoration-blue-400 transition-all text-xs"
    >
      {host.replace('www.', '')} ↗
    </a>
  );
}