import { TypeSafeClient } from "@typesafe-ai/sdk";

let client: TypeSafeClient | undefined;

function getClient() {
  if (!client) client = new TypeSafeClient();
  return client;
}

const RELEVANCE_LEVELS = [
  "Not relevant to the interest profile at all — skip it",
  "Marginally relevant — tangential to the interest profile",
  "Relevant — clearly within the interest profile, worth reading",
  "Highly relevant — a must-read for someone with this interest profile",
] as const;

const ARTICLE_TYPE_CRITERIA = {
  new_tool_or_framework:
    "A new (or newly notable) tool, library, framework, or class of model/technology that people can go try, install, or build with — the kind of thing that has or will soon have docs, a repo, or tutorials.",
  technique_or_method:
    "A specific technique, method, or how-to insight (not tied to one named tool) that a practitioner could apply.",
  new_model_release:
    "A model release or update from a known lab/vendor, covered as an announcement rather than something to build with hands-on.",
  research_finding:
    "A research paper, benchmark, or scientific/technical finding, reported as a result rather than a tool to use.",
  business_or_funding:
    "Business, funding, acquisition, leadership, or market news with no hands-on technical component.",
  other: "Doesn't clearly fit the other categories.",
} as const;

export interface JevArticleJudgment {
  relevanceScore: number; // normalized 0-1
  relevanceConfidence: number;
  relevanceLegend: Record<string, string>;
  articleType: keyof typeof ARTICLE_TYPE_CRITERIA;
  articleTypeProbabilities: Record<string, number>;
  actionableProbability: number; // 0-1, Noul has no separate confidence
  rawResponse: unknown;
}

export interface ArticleForJudgment {
  title: string;
  blurb: string;
  sourceDomain: string;
}

export async function judgeArticle(
  article: ArticleForJudgment,
  interestProfileDescription: string,
): Promise<JevArticleJudgment> {
  const { answers, ...meta } = await getClient().systemOne({
    state: {
      article: {
        title: article.title,
        blurb: article.blurb,
        sourceDomain: article.sourceDomain,
      },
      profile: {
        description: interestProfileDescription,
      },
    },
    questions: {
      relevance: {
        type: "score",
        instructions:
          "How relevant is `article` to the interests described in `profile.description`? Judge from the title, blurb, and source alone.",
        criteria: RELEVANCE_LEVELS,
      },
      articleType: {
        type: "choice",
        instructions: "What kind of update is `article`?",
        criteria: ARTICLE_TYPE_CRITERIA,
      },
      actionable: {
        type: "noul",
        instructions:
          "Does `article` describe something with real hands-on material likely to exist to find — a new tool, framework, library, or technique someone could search for docs/tutorials/a repo on — as opposed to being primarily news (a release announcement, incremental update, research report, or business/funding news) with nothing further to search for?",
      },
    },
  });

  const levels = RELEVANCE_LEVELS.length - 1;

  return {
    relevanceScore: answers.relevance.score / levels,
    relevanceConfidence: answers.relevance.confidence,
    relevanceLegend: answers.relevance.legend as Record<string, string>,
    articleType: answers.articleType.choice,
    articleTypeProbabilities: answers.articleType.probabilities,
    actionableProbability: answers.actionable.noul,
    rawResponse: { answers, ...meta },
  };
}
