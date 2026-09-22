export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export async function searxngSearch(query: string, limit = 5): Promise<SearchResult[]> {
  const base = process.env.SEARXNG_URL ?? "http://localhost:8080";
  const url = new URL("/search", base);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`SearXNG search failed: HTTP ${res.status}`);
  }

  const data = (await res.json()) as {
    results?: { title: string; url: string; content?: string }[];
  };

  return (data.results ?? []).slice(0, limit).map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.content ?? "",
  }));
}
