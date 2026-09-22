"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { runPipeline } from "@/lib/pipeline";
import { updateInterestProfile } from "@/lib/settings";

export async function triggerRun(editionSlug: string, date: string) {
  await runPipeline(editionSlug, date);
  revalidatePath("/");
}

export async function saveSettings(formData: FormData) {
  const description = String(formData.get("description") ?? "");
  const relevanceThreshold = Number(formData.get("relevanceThreshold"));
  const actionableThreshold = Number(formData.get("actionableThreshold"));

  await updateInterestProfile({
    description,
    relevanceThreshold,
    actionableThreshold,
  });

  revalidatePath("/settings");
  revalidatePath("/");
}

export async function toggleEdition(id: string, enabled: boolean) {
  await db.edition.update({ where: { id }, data: { enabled } });
  revalidatePath("/settings");
  revalidatePath("/");
}

export async function addEdition(slug: string, name: string) {
  await db.edition.create({ data: { slug, name, enabled: true } });
  revalidatePath("/settings");
  revalidatePath("/");
}
