/*
  Warnings:

  - You are about to drop the column `actionableConfidence` on the `JevJudgment` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_JevJudgment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT NOT NULL,
    "relevanceScore" REAL NOT NULL,
    "relevanceConfidence" REAL NOT NULL,
    "relevanceLegend" TEXT NOT NULL,
    "articleType" TEXT NOT NULL,
    "articleTypeProbabilities" TEXT NOT NULL,
    "actionableProbability" REAL NOT NULL,
    "rawResponse" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JevJudgment_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_JevJudgment" ("actionableProbability", "articleId", "articleType", "articleTypeProbabilities", "createdAt", "id", "rawResponse", "relevanceConfidence", "relevanceLegend", "relevanceScore") SELECT "actionableProbability", "articleId", "articleType", "articleTypeProbabilities", "createdAt", "id", "rawResponse", "relevanceConfidence", "relevanceLegend", "relevanceScore" FROM "JevJudgment";
DROP TABLE "JevJudgment";
ALTER TABLE "new_JevJudgment" RENAME TO "JevJudgment";
CREATE UNIQUE INDEX "JevJudgment_articleId_key" ON "JevJudgment"("articleId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
