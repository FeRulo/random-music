import type { Clef, KeySignature } from '../types';

// Índices en el grid de 9 posiciones del pentagrama (0 = arriba, 8 = abajo)
// Clave de Fa: del script Python original
const BASS_SHARPS_POSITIONS  = [2, 5, 1, 4, 7];       // F3 C3 G3 D3 A2
const BASS_FLATS_POSITIONS   = [6, 3, 7, 4, 8, 5];     // B2 E3 A2 D3 G2 C3

// Clave de Sol: teoría musical estándar
const TREBLE_SHARPS_POSITIONS = [0, 3, 6, 2, 5, 1, 4]; // F5 C5 G4 D5 A4 E5 B4
const TREBLE_FLATS_POSITIONS  = [4, 1, 5, 2, 6, 3, 7]; // B4 E5 A4 D5 G4 C5 F4

export function getKeySignaturePositions(clef: Clef, sig: KeySignature): number[] {
  if (sig.accidental === 'none' || sig.count === 0) return [];
  const arr = clef === 'bass'
    ? (sig.accidental === 'sharp' ? BASS_SHARPS_POSITIONS : BASS_FLATS_POSITIONS)
    : (sig.accidental === 'sharp' ? TREBLE_SHARPS_POSITIONS : TREBLE_FLATS_POSITIONS);
  return arr.slice(0, sig.count);
}

export function randomKeySignature(): KeySignature {
  const r = Math.random();
  if (r < 0.2) return { accidental: 'none', count: 0 };
  const accidental = Math.random() < 0.5 ? 'sharp' : 'flat';
  const count = 1 + Math.floor(Math.random() * 4); // 1-4 accidentals
  return { accidental, count };
}

export function keySignatureLabel(sig: KeySignature): string {
  if (sig.accidental === 'none' || sig.count === 0) return 'Do mayor';
  const symbol = sig.accidental === 'sharp' ? '♯' : '♭';
  return `${sig.count}${symbol}`;
}
