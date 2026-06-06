import type { LeaderboardEntry } from '../types';

const BASE = 'http://localhost:3001/api';

function extractParts(key: string): { mode: string; clef: string; keySig: string; difficulty: string } {
  const parts = key.slice('rmusic_lb_'.length).split('_');
  // Rhythm key: rmusic_lb_{mode}_rhythm_{clef}_{keySig}_{difficulty}_{bpm}bpm
  if (parts[1] === 'rhythm') {
    const [mode, , clef, keySig, difficulty, bpmPart] = parts;
    return { mode: `${mode}_rhythm_${bpmPart}`, clef, keySig, difficulty };
  }
  // Velocity key: rmusic_lb_{mode}_{clef}_{keySig}_{difficulty}
  const [mode, clef, keySig, difficulty] = parts;
  return { mode, clef, keySig, difficulty };
}

export async function apiLoadLeaderboard(key: string): Promise<LeaderboardEntry[]> {
  const { mode, clef, keySig, difficulty } = extractParts(key);
  const url = `${BASE}/leaderboard?mode=${mode}&clef=${clef}&keySig=${keySig}&difficulty=${difficulty}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<LeaderboardEntry[]>;
}

export async function apiSaveEntry(key: string, entry: LeaderboardEntry): Promise<void> {
  const { mode, clef, keySig, difficulty } = extractParts(key);
  const res = await fetch(`${BASE}/leaderboard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, clef, keySig, difficulty: Number(difficulty), entry }),
    signal: AbortSignal.timeout(2000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}
