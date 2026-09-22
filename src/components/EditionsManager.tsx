"use client";

import { useState, useTransition } from "react";
import { toggleEdition, addEdition } from "@/app/actions";

interface Edition {
  id: string;
  slug: string;
  name: string;
  enabled: boolean;
}

export function EditionsManager({ editions }: { editions: Edition[] }) {
  const [isPending, startTransition] = useTransition();
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <ul className="flex flex-col gap-2">
        {editions.map((e) => (
          <li
            key={e.id}
            className="flex items-center justify-between border border-neutral-200 bg-white rounded-md px-3 py-2 text-sm"
          >
            <div>
              <div className="font-medium text-neutral-900">{e.name}</div>
              <div className="text-xs text-neutral-500">
                tldr.tech/{e.slug}/&lt;date&gt;
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs text-neutral-500 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked={e.enabled}
                disabled={isPending}
                onChange={(ev) =>
                  startTransition(() => toggleEdition(e.id, ev.target.checked))
                }
                className="cursor-pointer accent-blue-600"
              />
              enabled
            </label>
          </li>
        ))}
      </ul>

      <form
        action={() =>
          startTransition(async () => {
            if (!slug.trim() || !name.trim()) return;
            await addEdition(slug.trim(), name.trim());
            setSlug("");
            setName("");
          })
        }
        className="flex items-end gap-2 pt-2 border-t border-neutral-200"
      >
        <label className="flex flex-col gap-1 text-xs text-neutral-500 mt-2">
          tldr.tech slug
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="crypto"
            className="bg-white text-neutral-900 border border-neutral-300 rounded-md px-2 py-1.5 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-neutral-500 mt-2">
          Display name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="TLDR Crypto"
            className="bg-white text-neutral-900 border border-neutral-300 rounded-md px-2 py-1.5 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500"
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="px-3 py-1.5 rounded-md border border-neutral-300 text-sm text-neutral-900 hover:border-neutral-400 disabled:opacity-50 cursor-pointer transition-colors"
        >
          Add
        </button>
      </form>
    </div>
  );
}
