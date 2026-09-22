"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { triggerRun } from "@/app/actions";

interface Edition {
  id: string;
  slug: string;
  name: string;
}

export function RunControls({
  editions,
  selectedEdition,
  selectedDate,
  runStatus,
}: {
  editions: Edition[];
  selectedEdition: string;
  selectedDate: string;
  runStatus: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    next.set(key, value);
    router.push(`/?${next.toString()}`);
  }

  function handleFetch() {
    startTransition(async () => {
      await triggerRun(selectedEdition, selectedDate);
    });
  }

  const isCached = runStatus === "COMPLETE";

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex flex-wrap gap-2">
        {editions.map((e) => (
          <button
            key={e.id}
            onClick={() => setParam("edition", e.slug)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
              e.slug === selectedEdition
                ? "bg-neutral-900 text-white border-neutral-900"
                : "border-neutral-300 text-neutral-600 hover:border-neutral-400 hover:text-neutral-900"
            }`}
          >
            {e.name}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-neutral-200">
        <label className="flex items-center gap-2 text-sm text-neutral-600 pt-3">
          Issue date
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setParam("date", e.target.value)}
            className="bg-white text-neutral-900 border border-neutral-300 rounded-md px-2.5 py-1.5 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500"
          />
        </label>
        <button
          onClick={handleFetch}
          disabled={isPending}
          className="mt-3 px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-white cursor-pointer transition-colors"
        >
          {isPending
            ? "Analyzing…"
            : isCached
              ? "Re-fetch & analyze"
              : "Fetch & analyze"}
        </button>
        <div className="mt-3 text-xs">
          {isCached && !isPending && (
            <span className="text-neutral-500">
              Cached — loaded instantly, no Jev/agent calls made.
            </span>
          )}
          {runStatus === "ERROR" && !isPending && (
            <span className="text-red-600">Last run failed — try again.</span>
          )}
        </div>
      </div>
    </div>
  );
}
