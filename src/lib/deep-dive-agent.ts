import { generateText, tool, stepCountIs, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { searxngSearch, type SearchResult } from "./searxng";

export interface DeepDiveResult {
  resources: SearchResult[];
  model: string;
}

const webSearchTool = tool({
  description:
    "Search the public web. Use targeted queries aimed at hands-on material — " +
    'e.g. append "documentation", "tutorial", "getting started", or "github" to the ' +
    "tool/framework name — rather than the announcement headline itself, which mostly " +
    "surfaces more news coverage instead of things to actually read and use.",
  inputSchema: z.object({
    query: z.string().describe("The search query"),
  }),
  execute: async ({ query }) => {
    const results = await searxngSearch(query);
    return { results };
  },
});

const curatedResourcesSchema = z.object({
  resources: z
    .array(
      z.object({
        title: z.string(),
        url: z.string(),
      }),
    )
    .max(5)
    .describe(
      "Only resources that are genuinely hands-on material for learning or using this — " +
        "official docs, a getting-started guide, a tutorial/how-to, or the project's own " +
        "repository. Empty if none of the candidates qualify.",
    ),
});

export async function runDeepDive(article: {
  title: string;
  blurb: string;
  url: string;
}): Promise<DeepDiveResult> {
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const candidates: SearchResult[] = [];

  await generateText({
    model: openai(model),
    system:
      "You help a developer go deeper on a TLDR newsletter item that looks like a new tool, " +
      "framework, or technique. Run 2-3 distinct webSearch queries from different angles — " +
      "the project's official docs, a tutorial or getting-started guide, and its GitHub repo — " +
      "to surface hands-on material. You do not need to write anything after searching; " +
      "another step will select the best results from what you find.",
    prompt:
      `Article: "${article.title}"\n` +
      `Source: ${article.url}\n` +
      `Blurb: ${article.blurb}`,
    tools: { webSearch: webSearchTool },
    stopWhen: stepCountIs(4),
    onStepFinish: (step) => {
      for (const toolResult of step.toolResults ?? []) {
        const output = toolResult.output as { results?: SearchResult[] } | undefined;
        if (output?.results) candidates.push(...output.results);
      }
    },
  });

  const seen = new Set<string>([article.url]);
  const deduped = candidates.filter((r) => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });

  if (deduped.length === 0) {
    return { resources: [], model };
  }

  const { output } = await generateText({
    model: openai(model),
    output: Output.object({ schema: curatedResourcesSchema }),
    system:
      "You select which search results are genuinely worth reading for someone who wants " +
      "to actually use or learn this tool/technique — not just read more about the news of it. " +
      "Exclude general news coverage, press releases, opinion pieces, or anything reporting on " +
      "the same announcement rather than teaching how to use it. Only choose from the given " +
      "candidates; never invent a title or URL.",
    prompt:
      `Article: "${article.title}"\n` +
      `Blurb: ${article.blurb}\n\n` +
      "Candidates:\n" +
      deduped
        .map((r, i) => `${i + 1}. ${r.title} — ${r.url}\n   ${r.snippet}`)
        .join("\n"),
  });

  const byUrl = new Map(deduped.map((r) => [r.url, r]));
  const resources = output.resources
    .map((r) => byUrl.get(r.url))
    .filter((r): r is SearchResult => r !== undefined);

  return { resources, model };
}
