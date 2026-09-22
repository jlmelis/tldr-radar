import * as cheerio from "cheerio";

export interface ScrapedArticle {
  title: string;
  url: string;
  sourceDomain: string;
  category: string;
  blurb: string;
  readTimeMinutes: number | null;
  order: number;
}

export interface ScrapeResult {
  found: boolean;
  articles: ScrapedArticle[];
}

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36";

// TLDR redirects to the homepage when no issue was published for a given date
// (weekends, holidays). We detect that by checking whether the response's final
// URL still matches the requested edition/date, rather than by status code.
export async function scrapeTldrIssue(
  edition: string,
  date: string,
): Promise<ScrapeResult> {
  const url = `https://tldr.tech/${edition}/${date}`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    redirect: "follow",
  });

  if (!res.url.includes(`/${edition}/${date}`)) {
    return { found: false, articles: [] };
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  const articles: ScrapedArticle[] = [];
  let order = 0;

  $("section").each((_, section) => {
    const category = $(section).find("header h3").first().text().trim();
    if (!category) return;

    $(section)
      .find("article")
      .each((_, article) => {
        const link = $(article).find("a").first();
        const href = link.attr("href");
        if (!href) return;

        const rawTitle = link.find("h3").first().text().trim();
        const match = rawTitle.match(/^(.*?)\s*\((?:(\d+) minute read|Sponsor)\)\s*$/i);
        if (!match) return; // unrecognized title shape, skip rather than guess
        const [, title, minutes] = match;
        if (minutes === undefined) return; // sponsored post, not an article

        const blurb = $(article).find(".newsletter-html").first().text().trim();

        let sourceDomain = "";
        try {
          sourceDomain = new URL(href).hostname.replace(/^www\./, "");
        } catch {
          return;
        }

        articles.push({
          title,
          url: href,
          sourceDomain,
          category,
          blurb,
          readTimeMinutes: Number(minutes),
          order: order++,
        });
      });
  });

  return { found: true, articles };
}
