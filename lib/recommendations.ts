import type { CatProfile } from "@/lib/use-persistent-state";

export type FollowSignal = {
  catId: string; breed: string; birthDate: string; sterilized: boolean;
  lifestyle: "Interior" | "Exterior"; preferences: string[]; listingId: number; wouldChooseAgain?: boolean;
};

export type SimilarCatRecommendation = { listingId: number; similarCats: number; score: number; repurchaseRate: number };

export function buildSimilarCatRecommendations(cat: CatProfile, signals: FollowSignal[]) {
  const preferences = new Set([...cat.food, ...cat.litter, ...cat.toys].map(value => value.toLowerCase()));
  const scores = new Map<number, { score: number; matches: number; positive: number }>();
  for (const signal of signals) {
    if (signal.catId === cat.id) continue;
    let similarity = 0;
    if (signal.breed.trim().toLowerCase() === cat.breed.trim().toLowerCase()) similarity += 3;
    if (signal.sterilized === cat.sterilized) similarity += 1;
    if (signal.lifestyle === cat.lifestyle) similarity += 2;
    const birthYear = Number(cat.birthDate.slice(0, 4)); const signalYear = Number(signal.birthDate.slice(0, 4));
    if (birthYear && signalYear && Math.abs(birthYear - signalYear) <= 2) similarity += 2;
    if (signal.preferences.some(value => preferences.has(value.toLowerCase()))) similarity += 2;
    if (similarity < 5) continue;
    const current = scores.get(signal.listingId) || { score: 0, matches: 0, positive: 0 };
    scores.set(signal.listingId, { score: current.score + similarity, matches: current.matches + 1, positive: current.positive + (signal.wouldChooseAgain === false ? 0 : 1) });
  }
  return [...scores.entries()].filter(([, value]) => value.matches >= 3).sort((a, b) => b[1].score - a[1].score).map(([listingId, value]) => {
    return { listingId, similarCats: value.matches, score: value.score, repurchaseRate: Math.round((value.positive / value.matches) * 100) };
  }).slice(0, 3);
}
