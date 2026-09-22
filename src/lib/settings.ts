import { db } from "./db";

const DEFAULT_PROFILE_ID = "default";

const DEFAULT_DESCRIPTION =
  "AI/ML tooling and infrastructure, developer tools, new frameworks and libraries, " +
  "LLM agents and applied AI engineering. Not interested in general business/funding news, " +
  "consumer gadgets, or crypto.";

export async function getInterestProfile() {
  const existing = await db.interestProfile.findUnique({
    where: { id: DEFAULT_PROFILE_ID },
  });
  if (existing) return existing;

  return db.interestProfile.create({
    data: {
      id: DEFAULT_PROFILE_ID,
      description: DEFAULT_DESCRIPTION,
      relevanceThreshold: 0.6,
      actionableThreshold: 0.6,
    },
  });
}

export async function updateInterestProfile(input: {
  description?: string;
  relevanceThreshold?: number;
  actionableThreshold?: number;
}) {
  await getInterestProfile(); // ensure it exists
  return db.interestProfile.update({
    where: { id: DEFAULT_PROFILE_ID },
    data: input,
  });
}
