"use client";

import { useState } from "react";
import type { ArticleView } from "@/lib/pipeline";

function Bar({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-neutral-500">
      <span className="w-20 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-neutral-200 overflow-hidden">
        <div
          className="h-full bg-neutral-700"
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </div>
      <span className="w-10 text-right tabular-nums">{Math.round(value * 100)}%</span>
    </div>
  );
}

function ArticleDetail({ article }: { article: ArticleView }) {
  return (
    <div className="mt-3 pt-3 border-t border-neutral-200 flex flex-col gap-3 text-sm">
      <p className="text-neutral-700">{article.blurb}</p>

      <div className="rounded border border-neutral-200 p-3 flex flex-col gap-2">
        <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
          Jev judgment
        </div>
        <Bar value={article.jev.relevanceScore} label="Relevance" />
        <div className="text-xs text-neutral-500">
          confidence {Math.round(article.jev.relevanceConfidence * 100)}% · legend:{" "}
          {Object.entries(article.jev.relevanceLegend)
            .map(([k, v]) => `${k}=${v}`)
            .join(" · ")}
        </div>
        <Bar value={article.jev.actionableProbability} label="Actionable" />
        <div className="text-xs text-neutral-500">
          Type: <span className="text-neutral-700">{article.jev.articleType}</span> —{" "}
          {Object.entries(article.jev.articleTypeProbabilities)
            .sort((a, b) => b[1] - a[1])
            .map(([k, v]) => `${k} ${Math.round(v * 100)}%`)
            .join(", ")}
        </div>
      </div>

      {article.deepDive && (
        <div className="rounded border border-neutral-200 p-3 flex flex-col gap-2">
          <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
            Deep dive {article.deepDive.status === "ERROR" && "(failed)"}
          </div>
          {article.deepDive.summary && (
            <p className="text-neutral-700">{article.deepDive.summary}</p>
          )}
          {article.deepDive.error && (
            <p className="text-red-600 text-xs">{article.deepDive.error}</p>
          )}
          {article.deepDive.resources.length > 0 && (
            <ul className="flex flex-col gap-1">
              {article.deepDive.resources.map((r) => (
                <li key={r.url}>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {r.title}
                  </a>
                  {r.snippet && (
                    <span className="text-neutral-500"> — {r.snippet.slice(0, 100)}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function ArticleRow({ article }: { article: ArticleView }) {
  const [open, setOpen] = useState(false);

  return (
    <li className="border border-neutral-200 rounded-lg p-4 hover:border-neutral-300 transition-colors">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left flex flex-col gap-1.5 cursor-pointer"
      >
        <div className="flex items-start justify-between gap-3">
          <span className="flex items-start gap-2 font-medium">
            <span
              className={`mt-1 text-neutral-400 text-[10px] transition-transform ${open ? "rotate-90" : ""}`}
              aria-hidden
            >
              ▶
            </span>
            {article.title}
          </span>
          <span className="shrink-0 text-xs text-neutral-500">
            {article.readTimeMinutes ? `${article.readTimeMinutes} min` : ""}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 ml-4">
          <span>{article.sourceDomain}</span>
          <span>·</span>
          <span>{article.category}</span>
          <span className="px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700">
            {article.jev.articleType}
          </span>
          <span>relevance {Math.round(article.jev.relevanceScore * 100)}%</span>
          {article.hasAdditionalResources ? (
            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
              additional resources
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500">
              no additional resources
            </span>
          )}
        </div>
      </button>
      {open && <ArticleDetail article={article} />}
    </li>
  );
}

export function ArticleList({
  articles,
  runStatus,
}: {
  articles: ArticleView[];
  runStatus: string | null;
}) {
  const [showFiltered, setShowFiltered] = useState(false);

  if (!runStatus) {
    return (
      <p className="text-neutral-500 text-sm rounded-lg border border-dashed border-neutral-300 px-4 py-6 text-center">
        No run yet for this date/edition — click &ldquo;Fetch &amp; analyze&rdquo; above.
      </p>
    );
  }

  const relevant = articles.filter((a) => a.passesInterestGate);
  const filtered = articles.filter((a) => !a.passesInterestGate);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">
          {relevant.length} relevant article{relevant.length === 1 ? "" : "s"} of{" "}
          {articles.length} scraped
        </p>
        {filtered.length > 0 && (
          <button
            onClick={() => setShowFiltered((v) => !v)}
            className="text-xs text-neutral-500 hover:text-neutral-700 underline cursor-pointer"
          >
            {showFiltered ? "Hide" : "Show"} {filtered.length} filtered out
          </button>
        )}
      </div>

      {relevant.length === 0 && (
        <p className="text-neutral-500 text-sm">
          No articles cleared the interest gate for this issue.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {relevant.map((a) => (
          <ArticleRow key={a.id} article={a} />
        ))}
      </ul>

      {showFiltered && filtered.length > 0 && (
        <>
          <div className="text-xs uppercase tracking-wide text-neutral-500 mt-2">
            Filtered out (below relevance threshold)
          </div>
          <ul className="flex flex-col gap-3 opacity-70">
            {filtered.map((a) => (
              <ArticleRow key={a.id} article={a} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
