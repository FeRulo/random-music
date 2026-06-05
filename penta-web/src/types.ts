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
  difficulty: 0 | 1 | 2 | 3;
  mode: GameMode;
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
}

export interface GameState {
  phase: GamePhase;
  settings: GameSettings;
  noteSequence: NotePosition[];
  currentIndex: number;
  noteStartTime: number; // performance.now()
  answered: AnsweredNote[];
  practicePoints: number;
  practiceGameStartTime: number;
  countdownSecondsLeft: number;
  countdownStartTime: number; // performance.now() when countdown began
  countdownCorrect: number;
  finalScore: number | null; // set when phase transitions to 'result'
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
