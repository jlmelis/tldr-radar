import { format } from "date-fns";
import { ensureDefaultEditions, listEditions } from "@/lib/editions";
import { getRunView } from "@/lib/pipeline";
import { RunControls } from "@/components/RunControls";
import { ArticleList } from "@/components/ArticleList";

// Always reads live database state (editions, cached runs) — never prerender.
export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ edition?: string; date?: string }>;
}) {
  await ensureDefaultEditions();
  const editions = (await listEditions()).filter((e) => e.enabled);

  const params = await searchParams;
  const editionSlug = params.edition ?? editions[0]?.slug ?? "tech";
  const date = params.date ?? format(new Date(), "yyyy-MM-dd");

  const { run, articles } = await getRunView(editionSlug, date);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          {editions.find((e) => e.slug === editionSlug)?.name ?? editionSlug}
        </h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Articles Jev judged relevant to your interest profile for this issue.
        </p>
      </div>
      <RunControls
        editions={editions}
        selectedEdition={editionSlug}
        selectedDate={date}
        runStatus={run?.status ?? null}
      />
      <ArticleList articles={articles} runStatus={run?.status ?? null} />
    </div>
  );
}
