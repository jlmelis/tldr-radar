import { ensureDefaultEditions, listEditions } from "@/lib/editions";
import { getInterestProfile } from "@/lib/settings";
import { SettingsForm } from "@/components/SettingsForm";
import { EditionsManager } from "@/components/EditionsManager";

// This page reads live, mutable settings from the database — it must never be
// statically prerendered (which would also require a database at build time).
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await ensureDefaultEditions();
  const [profile, editions] = await Promise.all([
    getInterestProfile(),
    listEditions(),
  ]);

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <h1 className="text-lg font-semibold">Interest profile & thresholds</h1>
        <SettingsForm profile={profile} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Tracked editions</h2>
        <EditionsManager editions={editions} />
      </section>
    </div>
  );
}
