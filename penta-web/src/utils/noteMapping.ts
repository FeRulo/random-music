import { CIFRADO_BASS, CIFRADO_TREBLE } from '../constants';
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

export function buildNotePool(clef: Clef, espacios: number): NotePosition[] {
  const cifrado = clef === 'bass' ? [...CIFRADO_BASS] : [...CIFRADO_TREBLE];
  const totalPositions = 9 + 2 * espacios;
  const rotated = cambiarOrden(-espacios, cifrado);
  const letters = extenderLista(rotated, totalPositions);
  return letters.map((letter, staffIndex) => ({ staffIndex, letter }));
}
