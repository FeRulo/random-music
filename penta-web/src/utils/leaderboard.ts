import { LEADERBOARD_KEY_PREFIX, LEADERBOARD_MAX_ENTRIES } from '../constants';
import type { GameSettings, LeaderboardEntry } from '../types';
import { apiLoadLeaderboard } from './leaderboardApi';

export function getLeaderboardKey(settings: GameSettings): string {
  const { mode, clef, keySignature, difficulty, randomKeySignature, rhythmMode, ritmoBpm } = settings;
  const keySig = randomKeySignature
    ? 'random'
    : keySignature.accidental === 'none'
      ? 'none'
      : `${keySignature.accidental}${keySignature.count}`;
  if (rhythmMode) {
    return `${LEADERBOARD_KEY_PREFIX}${mode}_rhythm_${clef}_${keySig}_${difficulty}_${ritmoBpm}bpm`;
  }
  return `${LEADERBOARD_KEY_PREFIX}${mode}_${clef}_${keySig}_${difficulty}`;
}

export function loadLeaderboardLocal(key: string): LeaderboardEntry[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]') as LeaderboardEntry[];
  } catch {
    return [];
  }
}

export function saveLeaderboardLocal(key: string, entries: LeaderboardEntry[]): void {
  localStorage.setItem(key, JSON.stringify(entries.slice(0, LEADERBOARD_MAX_ENTRIES)));
}

export async function loadLeaderboard(key: string): Promise<LeaderboardEntry[]> {
  try {
    const entries = await apiLoadLeaderboard(key);
    saveLeaderboardLocal(key, entries);
    return entries;
  } catch {
    return loadLeaderboardLocal(key);
  }
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
