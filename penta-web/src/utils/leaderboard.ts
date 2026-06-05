import { LEADERBOARD_KEY_PREFIX, LEADERBOARD_MAX_ENTRIES } from '../constants';
import type { GameSettings, LeaderboardEntry } from '../types';

export function getLeaderboardKey(settings: GameSettings): string {
  const { mode, clef, keySignature, difficulty, randomKeySignature } = settings;
  const keySig = randomKeySignature
    ? 'random'
    : keySignature.accidental === 'none'
      ? 'none'
      : `${keySignature.accidental}${keySignature.count}`;
  return `${LEADERBOARD_KEY_PREFIX}${mode}_${clef}_${keySig}_${difficulty}`;
}

export function loadLeaderboard(key: string): LeaderboardEntry[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]') as LeaderboardEntry[];
  } catch {
    return [];
  }
}

export function saveLeaderboard(key: string, entries: LeaderboardEntry[]): void {
  localStorage.setItem(key, JSON.stringify(entries.slice(0, LEADERBOARD_MAX_ENTRIES)));
}

export function insertEntry(
  entries: LeaderboardEntry[],
  newEntry: LeaderboardEntry,
): LeaderboardEntry[] {
  return [...entries, newEntry]
    .sort((a, b) => b.score - a.score)
    .slice(0, LEADERBOARD_MAX_ENTRIES);
}

export function isTopScore(entries: LeaderboardEntry[], score: number): boolean {
  if (score <= 0) return false;
  return (
    entries.length < LEADERBOARD_MAX_ENTRIES ||
    score > entries[entries.length - 1].score
  );
}
