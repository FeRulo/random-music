import { CIFRADO_BASS, CIFRADO_TREBLE, difficultyToEspacios } from '../constants';
import type { Clef, NotePosition } from '../types';

function cambiarOrden(pos: number, lista: readonly string[]): string[] {
  const len = lista.length;
  const idx = ((pos % len) + len) % len;
  return [...lista.slice(idx), ...lista.slice(0, idx)];
}

function extenderLista(lista: string[], size: number): string[] {
  const reps = Math.floor(size / lista.length);
  const rest = size % lista.length;
  return [...Array(reps).fill(null).flatMap(() => lista), ...lista.slice(0, rest)];
}

export function buildNotePool(clef: Clef, difficulty: number): NotePosition[] {
  const espacios = difficultyToEspacios(difficulty);
  const cifrado = clef === 'bass' ? [...CIFRADO_BASS] : [...CIFRADO_TREBLE];
  const totalPositions = 9 + 2 * espacios;
  const rotated = cambiarOrden(-espacios, cifrado);
  const letters = extenderLista(rotated, totalPositions);
  const pool = letters.map((letter, staffIndex) => ({ staffIndex, letter }));

  // Levels 0-2: restrict to a center slice of the full staff (no ledger lines)
  // center = staffIndex 4 (middle line); halfWidth = difficulty + 1 → 1, 2, or 3
  if (difficulty < 3) {
    const halfWidth = difficulty + 1;
    const center = 4;
    return pool.filter(n => n.staffIndex >= center - halfWidth && n.staffIndex <= center + halfWidth);
  }
  return pool;
}
