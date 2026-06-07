export type Clef = 'treble' | 'bass';
export type GameMode = 'practice' | 'countdown';
export type Accidental = 'sharp' | 'flat' | 'none';
export type GamePhase = 'menu' | 'playing' | 'result';

export interface KeySignature {
  accidental: Accidental;
  count: number; // 0-6
}

export interface GameSettings {
  clef: Clef;
  keySignature: KeySignature;
  randomKeySignature: boolean;
  difficulty: number; // 0-9: see DIFFICULTY_LABELS in constants.ts
  mode: GameMode;
  rhythmMode: boolean;
  ritmoBpm: number;       // initial BPM (40–200)
  ritmoAccelStep: number; // BPM added every 16 notes in countdown
}

export interface NotePosition {
  staffIndex: number; // 0 = topmost position on staff
  letter: string;     // 'A'-'G'
}

export interface AnsweredNote {
  note: NotePosition;
  responseTimeMs: number;
  correct: boolean;
  delta: number;
  timingAccuracy: number | null; // 0.0–1.0 in rhythm mode, null in velocity
  timingOffsetMs: number | null; // |pressWallTime - beatWallTime| in ms, null in velocity/miss
  missed: boolean;               // true = beat arrived without a correct answer
  pressedLetter: string | null;  // key the user pressed (null if missed with no press or correct)
}

export interface GameState {
  phase: GamePhase;
  settings: GameSettings;
  noteSequence: NotePosition[];
  currentIndex: number;
  noteStartTime: number; // performance.now() — wall time of last beat (rhythm) or last correct answer
  answered: AnsweredNote[];
  practicePoints: number;
  practiceGameStartTime: number;
  countdownSecondsLeft: number;
  countdownStartTime: number; // performance.now() when countdown began
  countdownCorrect: number;
  finalScore: number | null; // set when phase transitions to 'result'
  // Rhythm mode
  ritmoBpmCurrent: number;
  ritmoBeatCount: number;
  ritmoScore: number;              // accumulated score for Practice + Rhythm
  ritmoBpmJustIncreased: boolean;  // true for one beat after a BPM increase → UI flash
  ritmoCurrentAnswer: { pressWallTime: number; responseTimeMs: number } | null;
  ritmoPrep: number;               // prep beats remaining before gameplay starts (counts 4→0)
  ritmoWrongPressLetter: string | null; // last wrong key pressed this beat (cleared on BEAT)
  paused: boolean;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
  difficulty: number;
  clef: Clef;
  keySignature: KeySignature;
  mode: GameMode;
}
