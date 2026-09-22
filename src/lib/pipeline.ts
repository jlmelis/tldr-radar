import { db } from "./db";
import { scrapeTldrIssue } from "./tldr-scraper";
import { judgeArticle } from "./jev";
import { runDeepDive } from "./deep-dive-agent";
import { getInterestProfile } from "./settings";

export async function runPipeline(
  editionSlug: string,
  date: string,
  options?: { force?: boolean },
) {
  const force = options?.force ?? false;
  const edition = await db.edition.findUniqueOrThrow({ where: { slug: editionSlug } });

  const existing = await db.run.findUnique({
    where: { date_editionId: { date, editionId: edition.id } },
  });
  if (existing?.status === "COMPLETE" && !force) {
    return existing; // cache hit, nothing to do
  }

  const run =
    existing ??
    (await db.run.create({
      data: { date, editionId: edition.id, status: "PENDING" },
    }));

  if (existing) {
    // Retrying a PENDING/ERROR run, or forcing a re-run of a COMPLETE one —
    // clear old articles (and their cascaded judgments/deep-dives) first, so
    // we don't duplicate or mix stale rows with the fresh pipeline run.
    await db.article.deleteMany({ where: { runId: run.id } });
    await db.run.update({ where: { id: run.id }, data: { status: "PENDING", error: null } });
  }

  try {
    const profile = await getInterestProfile();
    const scrape = await scrapeTldrIssue(editionSlug, date);

    if (!scrape.found) {
      return db.run.update({
        where: { id: run.id },
        data: { status: "COMPLETE", fetchedAt: new Date() },
      });
    }

    for (const scraped of scrape.articles) {
      const article = await db.article.create({
        data: {
          runId: run.id,
          title: scraped.title,
          url: scraped.url,
          sourceDomain: scraped.sourceDomain,
          category: scraped.category,
          blurb: scraped.blurb,
          readTimeMinutes: scraped.readTimeMinutes,
          order: scraped.order,
        },
      });

      const judgment = await judgeArticle(
        {
          title: article.title,
          blurb: article.blurb,
          sourceDomain: article.sourceDomain,
        },
        profile.description,
      );

      await db.jevJudgment.create({
        data: {
          articleId: article.id,
          relevanceScore: judgment.relevanceScore,
          relevanceConfidence: judgment.relevanceConfidence,
          relevanceLegend: JSON.stringify(judgment.relevanceLegend),
          articleType: judgment.articleType,
          articleTypeProbabilities: JSON.stringify(judgment.articleTypeProbabilities),
          actionableProbability: judgment.actionableProbability,
          rawResponse: JSON.stringify(judgment.rawResponse),
        },
      });

      const passesInterestGate = judgment.relevanceScore >= profile.relevanceThreshold;
      const hasAdditionalResources =
        passesInterestGate && judgment.actionableProbability >= profile.actionableThreshold;

      if (hasAdditionalResources) {
        try {
          const deepDive = await runDeepDive({
            title: article.title,
            blurb: article.blurb,
            url: article.url,
          });
          await db.deepDive.create({
            data: {
              articleId: article.id,
              status: "COMPLETE",
              resources: JSON.stringify(deepDive.resources),
              model: deepDive.model,
            },
          });
        } catch (err) {
          await db.deepDive.create({
            data: {
              articleId: article.id,
              status: "ERROR",
              error: err instanceof Error ? err.message : String(err),
            },
          });
        }
      }
    }

    return db.run.update({
      where: { id: run.id },
      data: { status: "COMPLETE", fetchedAt: new Date() },
    });
  } catch (err) {
    return db.run.update({
      where: { id: run.id },
      data: { status: "ERROR", error: err instanceof Error ? err.message : String(err) },
    });
  }
}

export interface ArticleView {
  id: string;
  title: string;
  url: string;
  sourceDomain: string;
  category: string;
  blurb: string;
  readTimeMinutes: number | null;
  jev: {
    relevanceScore: number;
    relevanceConfidence: number;
    relevanceLegend: Record<string, string>;
    articleType: string;
    articleTypeProbabilities: Record<string, number>;
    actionableProbability: number;
  };
  passesInterestGate: boolean;
  hasAdditionalResources: boolean;
  deepDive: {
    status: string;
    resources: { title: string; url: string; snippet: string }[];
    error: string | null;
  } | null;
}

export async function getRunView(editionSlug: string, date: string) {
  const edition = await db.edition.findUniqueOrThrow({ where: { slug: editionSlug } });
  const profile = await getInterestProfile();

  const run = await db.run.findUnique({
    where: { date_editionId: { date, editionId: edition.id } },
    include: {
      articles: {
        orderBy: { order: "asc" },
        include: { jevJudgment: true, deepDive: true },
      },
    },
  });

  if (!run) return { run: null, profile, articles: [] as ArticleView[] };

  const articles: ArticleView[] = run.articles
    .filter((a) => a.jevJudgment)
    .map((a) => {
      const j = a.jevJudgment!;
      const passesInterestGate = j.relevanceScore >= profile.relevanceThreshold;
      const hasAdditionalResources =
        passesInterestGate && j.actionableProbability >= profile.actionableThreshold;

      return {
        id: a.id,
        title: a.title,
        url: a.url,
        sourceDomain: a.sourceDomain,
        category: a.category,
        blurb: a.blurb,
        readTimeMinutes: a.readTimeMinutes,
        jev: {
          relevanceScore: j.relevanceScore,
          relevanceConfidence: j.relevanceConfidence,
          relevanceLegend: JSON.parse(j.relevanceLegend),
          articleType: j.articleType,
          articleTypeProbabilities: JSON.parse(j.articleTypeProbabilities),
          actionableProbability: j.actionableProbability,
        },
        passesInterestGate,
        hasAdditionalResources,
        deepDive: a.deepDive
          ? {
              status: a.deepDive.status,
              resources: a.deepDive.resources ? JSON.parse(a.deepDive.resources) : [],
              error: a.deepDive.error,
            }
          : null,
      };
    });

  return {
    run: { id: run.id, status: run.status, error: run.error, fetchedAt: run.fetchedAt },
    profile,
    articles,
  };
}
