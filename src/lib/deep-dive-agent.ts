import { generateText, tool, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { searxngSearch, type SearchResult } from "./searxng";

export interface DeepDiveResult {
  summary: string;
  resources: SearchResult[];
  model: string;
}

const webSearchTool = tool({
  description:
    "Search the public web for tutorials, documentation, and articles about a topic. Returns titles, URLs, and short snippets.",
  inputSchema: z.object({
    query: z.string().describe("The search query"),
  }),
  execute: async ({ query }) => {
    const results = await searxngSearch(query);
    return { results };
  },
});

export async function runDeepDive(article: {
  title: string;
  blurb: string;
  url: string;
}): Promise<DeepDiveResult> {
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const foundResources: SearchResult[] = [];

  const result = await generateText({
    model: openai(model),
    system:
      "You help a developer go deeper on a TLDR newsletter item that looks like a new tool, framework, or technique. " +
      "Use the webSearch tool (one or two focused queries) to find genuinely useful tutorials, docs, or getting-started guides — not more news about the same announcement. " +
      "Then write a short (2-4 sentence) summary of what's worth knowing and what you'd read first.",
    prompt:
      `Article: "${article.title}"\n` +
      `Source: ${article.url}\n` +
      `Blurb: ${article.blurb}\n\n` +
      "Find hands-on resources (docs, tutorials, getting-started guides, the project's repo) for this.",
    tools: { webSearch: webSearchTool },
    stopWhen: stepCountIs(4),
    onStepFinish: (step) => {
      for (const toolResult of step.toolResults ?? []) {
        const output = toolResult.output as { results?: SearchResult[] } | undefined;
        if (output?.results) foundResources.push(...output.results);
      }
    },
  });

  const seen = new Set<string>();
  const resources = foundResources.filter((r) => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });

  return {
    summary: result.text,
    resources,
    model,
  };
}
