export const NOTES_PER_ROUND = 16;
export const COUNTDOWN_START_SECONDS = 30;
export const COUNTDOWN_BONUS_THRESHOLD_S = 3; // acierto en < 3s añade tiempo
export const LEADERBOARD_MAX_ENTRIES = 5;
export const LEADERBOARD_KEY_PREFIX = 'rmusic_lb_';

// Difficulty levels 0-9: 0-2 restrict notes within the staff, 3 = full staff, 4-9 add ledger lines
export const DIFFICULTY_LABELS = [
  '3 notas',        // 0 — center ±1
  '5 notas',        // 1 — center ±2
  '7 notas',        // 2 — center ±3
  'Staff completo', // 3 — all 9 positions (current "Básico")
  '+1 línea',       // 4
  '+2 líneas',      // 5
  '+3 líneas',      // 6
  '+4 líneas',      // 7
  '+5 líneas',      // 8
  '+6 líneas',      // 9
] as const;

export const DIFFICULTY_MIN = 0;
export const DIFFICULTY_MAX = 9;
export const DIFFICULTY_DEFAULT = 3;

export function difficultyToEspacios(difficulty: number): number {
  return Math.max(0, difficulty - 3);
}

export const RITMO_BPM_DEFAULT        = 30;
export const RITMO_BPM_MIN            = 20;
export const RITMO_BPM_MAX            = 200; // max configurable en menú
export const RITMO_BPM_MAX_GAMEPLAY   = 220; // techo durante aceleración
export const RITMO_BPM_STEP           = 10;
export const RITMO_ACCEL_STEP_DEFAULT    = 10;
export const RITMO_LATE_WINDOW_FRACTION  = 0.2; // late window = 20% of beat window (dynamic per BPM)

// Cifrado (notas de arriba hacia abajo en el pentagrama)
export const CIFRADO_BASS   = ['A', 'G', 'F', 'E', 'D', 'C', 'B'] as const;
export const CIFRADO_TREBLE = ['F', 'E', 'D', 'C', 'B', 'A', 'G'] as const;

// Nombres de nota para mostrar en solfeo
export const SOLFEO: Record<string, string> = {
  C: 'Do', D: 'Re', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si',
};
