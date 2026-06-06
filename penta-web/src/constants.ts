export const NOTES_PER_ROUND = 16;
export const COUNTDOWN_START_SECONDS = 30;
export const COUNTDOWN_BONUS_THRESHOLD_S = 3; // acierto en < 3s añade tiempo
export const LEADERBOARD_MAX_ENTRIES = 5;
export const LEADERBOARD_KEY_PREFIX = 'rmusic_lb_';

export const RITMO_BPM_DEFAULT        = 30;
export const RITMO_BPM_MIN            = 20;
export const RITMO_BPM_MAX            = 200; // max configurable en menú
export const RITMO_BPM_MAX_GAMEPLAY   = 220; // techo durante aceleración
export const RITMO_BPM_STEP           = 10;
export const RITMO_ACCEL_STEP_DEFAULT = 10;

// Cifrado (notas de arriba hacia abajo en el pentagrama)
export const CIFRADO_BASS   = ['A', 'G', 'F', 'E', 'D', 'C', 'B'] as const;
export const CIFRADO_TREBLE = ['F', 'E', 'D', 'C', 'B', 'A', 'G'] as const;

// Nombres de nota para mostrar en solfeo
export const SOLFEO: Record<string, string> = {
  C: 'Do', D: 'Re', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si',
};
