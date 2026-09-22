import { db } from "./db";

export const DEFAULT_EDITIONS = [
  { slug: "tech", name: "TLDR Tech" },
  { slug: "webdev", name: "TLDR Web Dev" },
  { slug: "ai", name: "TLDR AI" },
];

export async function ensureDefaultEditions() {
  for (const edition of DEFAULT_EDITIONS) {
    await db.edition.upsert({
      where: { slug: edition.slug },
      update: {},
      create: edition,
    });
  }
}

export function listEditions() {
  return db.edition.findMany({ orderBy: { slug: "asc" } });
}
