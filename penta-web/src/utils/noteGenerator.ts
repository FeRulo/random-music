import type { NotePosition } from '../types';

export function generateNoteSequence(
  pool: NotePosition[],
  count: number,
): NotePosition[] {
  const result: NotePosition[] = [];
  let lastIndex = -1;
  while (result.length < count) {
    const candidate = pool[Math.floor(Math.random() * pool.length)];
    if (candidate.staffIndex !== lastIndex) {
      result.push(candidate);
      lastIndex = candidate.staffIndex;
    }
  }
  return result;
}
