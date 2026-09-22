"use client";

import { useState, useTransition } from "react";
import { saveSettings } from "@/app/actions";

interface Profile {
  description: string;
  relevanceThreshold: number;
  actionableThreshold: number;
}

export function SettingsForm({ profile }: { profile: Profile }) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [relevanceThreshold, setRelevanceThreshold] = useState(profile.relevanceThreshold);
  const [actionableThreshold, setActionableThreshold] = useState(profile.actionableThreshold);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await saveSettings(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <form
      action={handleSubmit}
      className="flex flex-col gap-5 rounded-xl border border-neutral-200 bg-neutral-50 p-4"
    >
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-neutral-700">
          What do you care about? Jev judges every article&apos;s relevance against this.
        </span>
        <textarea
          name="description"
          defaultValue={profile.description}
          rows={4}
          className="bg-white text-neutral-900 border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="flex items-center justify-between text-neutral-700">
          <span>Interest gate threshold — relevance ≥ this shows the article at all</span>
          <span className="tabular-nums text-neutral-900 font-medium">
            {Math.round(relevanceThreshold * 100)}%
          </span>
        </span>
        <input
          type="range"
          name="relevanceThreshold"
          min={0}
          max={1}
          step={0.05}
          value={relevanceThreshold}
          onChange={(e) => setRelevanceThreshold(Number(e.target.value))}
          className="accent-blue-600 cursor-pointer"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="flex items-center justify-between text-neutral-700">
          <span>Search gate threshold — actionable probability ≥ this triggers the deep-dive agent</span>
          <span className="tabular-nums text-neutral-900 font-medium">
            {Math.round(actionableThreshold * 100)}%
          </span>
        </span>
        <input
          type="range"
          name="actionableThreshold"
          min={0}
          max={1}
          step={0.05}
          value={actionableThreshold}
          onChange={(e) => setActionableThreshold(Number(e.target.value))}
          className="accent-blue-600 cursor-pointer"
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="self-start px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-sm font-medium text-white cursor-pointer transition-colors"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
        {saved && <span className="text-xs text-emerald-600">Saved</span>}
      </div>
    </form>
  );
}
