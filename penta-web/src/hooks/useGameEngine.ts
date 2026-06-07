import { useCallback, useReducer } from 'react';
import {
  NOTES_PER_ROUND,
  COUNTDOWN_START_SECONDS,
  COUNTDOWN_BONUS_THRESHOLD_S,
  RITMO_BPM_DEFAULT,
  RITMO_ACCEL_STEP_DEFAULT,
  RITMO_BPM_MAX_GAMEPLAY,
  RITMO_LATE_WINDOW_FRACTION,
  DIFFICULTY_DEFAULT,
} from '../constants';
import { buildNotePool } from '../utils/noteMapping';
import { generateNoteSequence } from '../utils/noteGenerator';
import { randomKeySignature } from '../utils/keySignature';
import { playNoteFrequency, playWrong, playGameOver } from '../utils/audio';
import type { GameState, GameSettings, AnsweredNote } from '../types';

type Action =
  | { type: 'START_GAME'; settings: GameSettings }
  | { type: 'KEY_PRESSED'; key: string; now: number }
  | { type: 'BEAT'; beatWallTime: number; beatIndex: number }
  | { type: 'TICK'; now: number }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'RESET' };

const defaultSettings: GameSettings = {
  clef: 'bass',
  keySignature: { accidental: 'none', count: 0 },
  randomKeySignature: false,
  difficulty: DIFFICULTY_DEFAULT,
  mode: 'practice',
  rhythmMode: false,
  ritmoBpm: RITMO_BPM_DEFAULT,
  ritmoAccelStep: RITMO_ACCEL_STEP_DEFAULT,
};

function makeInitialState(): GameState {
  return {
    phase: 'menu',
    settings: defaultSettings,
    noteSequence: [],
    currentIndex: 0,
    noteStartTime: 0,
    answered: [],
    practicePoints: 0,
    practiceGameStartTime: 0,
    countdownSecondsLeft: COUNTDOWN_START_SECONDS,
    countdownStartTime: 0,
    countdownCorrect: 0,
    finalScore: null,
    ritmoBpmCurrent: RITMO_BPM_DEFAULT,
    ritmoBeatCount: 0,
    ritmoScore: 0,
    ritmoBpmJustIncreased: false,
    ritmoCurrentAnswer: null,
    ritmoPrep: 0,
    ritmoWrongPressLetter: null,
    paused: false,
  };
}

function calcDelta(difficulty: number, responseMs: number): number {
  const secs = Math.max(responseMs / 1000, 0.05);
  return (900 + 100 * difficulty) / secs;
}

function calcTimingAccuracy(timingOffsetMs: number, beatWindowMs: number): number {
  const graceZone = beatWindowMs * 0.5;
  if (timingOffsetMs <= graceZone) return 1.0;
  return Math.max(0, 1 - (timingOffsetMs - graceZone) / graceZone);
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START_GAME': {
      const settings = { ...action.settings };
      if (settings.randomKeySignature) {
        settings.keySignature = randomKeySignature();
      }
      const pool = buildNotePool(settings.clef, settings.difficulty);
      const noteSequence = generateNoteSequence(pool, NOTES_PER_ROUND);
      const now = performance.now();
      return {
        ...makeInitialState(),
        phase: 'playing',
        settings,
        noteSequence,
        currentIndex: 0,
        noteStartTime: now,
        practiceGameStartTime: now,
        countdownStartTime: now,
        countdownSecondsLeft: COUNTDOWN_START_SECONDS,
        ritmoBpmCurrent: settings.ritmoBpm,
        ritmoPrep: settings.rhythmMode ? 4 : 0,
      };
    }

    case 'KEY_PRESSED': {
      if (state.phase !== 'playing') return state;
      const { key, now } = action;
      const { settings } = state;
      const currentNote = state.noteSequence[state.currentIndex];

      // --- Rhythm mode ---
      if (settings.rhythmMode) {
        if (state.ritmoPrep > 0) return state; // ignore keypresses during prep
        const correct = key === currentNote.letter;
        if (!correct) {
          playWrong();
          return { ...state, ritmoWrongPressLetter: key };
        }

        // Ignore if already answered correctly this beat
        if (state.ritmoCurrentAnswer !== null) return state;

        playNoteFrequency(currentNote.staffIndex, settings.difficulty, settings.clef);

        // Store press time; accuracy is calculated in BEAT using the actual beat wall time
        return {
          ...state,
          ritmoCurrentAnswer: { pressWallTime: now, responseTimeMs: now - state.noteStartTime },
        };
      }

      // --- Velocity mode (original logic) ---
      const responseMs = now - state.noteStartTime;
      const correct = key === currentNote.letter;
      const delta = calcDelta(settings.difficulty, responseMs);

      const answeredNote: AnsweredNote = {
        note: currentNote,
        responseTimeMs: responseMs,
        correct,
        delta,
        timingAccuracy: null,
        timingOffsetMs: null,
        missed: false,
        pressedLetter: correct ? null : key,
      };

      if (correct) {
        playNoteFrequency(currentNote.staffIndex, settings.difficulty, settings.clef);
      } else {
        playWrong();
      }

      if (settings.mode === 'practice') {
        const newPoints = correct
          ? state.practicePoints + delta
          : state.practicePoints - delta;
        const newIndex = correct ? state.currentIndex + 1 : state.currentIndex;
        const newAnswered = [...state.answered, answeredNote];

        if (newIndex >= NOTES_PER_ROUND) {
          playGameOver();
          const totalSecs = Math.max((now - state.practiceGameStartTime) / 1000, 0.1);
          const score = Math.round(newPoints / (totalSecs / NOTES_PER_ROUND));
          return {
            ...state,
            practicePoints: newPoints,
            currentIndex: newIndex,
            answered: newAnswered,
            phase: 'result',
            noteStartTime: now,
            finalScore: score,
          };
        }
        return {
          ...state,
          practicePoints: newPoints,
          currentIndex: newIndex,
          answered: newAnswered,
          noteStartTime: correct ? now : state.noteStartTime,
        };
      } else {
        // Countdown + Velocity
        let newSeconds = state.countdownSecondsLeft;
        const newCorrect = state.countdownCorrect + (correct ? 1 : 0);
        if (correct) {
          const responseSecs = responseMs / 1000;
          const bonus = Math.max(0, COUNTDOWN_BONUS_THRESHOLD_S - responseSecs);
          newSeconds = Math.min(newSeconds + bonus, COUNTDOWN_START_SECONDS * 2);
        }
        const newIndex = correct ? state.currentIndex + 1 : state.currentIndex;
        const newAnswered = [...state.answered, answeredNote];

        if (newIndex >= NOTES_PER_ROUND) {
          const pool = buildNotePool(settings.clef, settings.difficulty);
          const newSeq = generateNoteSequence(pool, NOTES_PER_ROUND);
          return {
            ...state,
            countdownSecondsLeft: newSeconds,
            countdownCorrect: newCorrect,
            currentIndex: 0,
            noteSequence: newSeq,
            answered: newAnswered,
            noteStartTime: now,
          };
        }

        return {
          ...state,
          countdownSecondsLeft: newSeconds,
          countdownCorrect: newCorrect,
          currentIndex: newIndex,
          answered: newAnswered,
          noteStartTime: correct ? now : state.noteStartTime,
        };
      }
    }

    case 'BEAT': {
      if (state.phase !== 'playing' || !state.settings.rhythmMode || state.paused) return state;

      const { beatWallTime, beatIndex } = action;

      // Consume prep beats without advancing game logic
      if (state.ritmoPrep > 0) {
        return { ...state, ritmoPrep: state.ritmoPrep - 1, noteStartTime: beatWallTime };
      }

      const currentNote = state.noteSequence[state.currentIndex];

      const beatWindowMs = 60000 / state.ritmoBpmCurrent;
      let timingAccuracy: number | null = null;
      let countdownBonus = 0;
      let ritmoScoreDelta = 0;

      let timingOffsetMs: number | null = null;
      if (state.ritmoCurrentAnswer) {
        // Accuracy = how close the keypress was to THIS beat (the one that just fired)
        timingOffsetMs = Math.abs(state.ritmoCurrentAnswer.pressWallTime - beatWallTime);
        timingAccuracy = calcTimingAccuracy(timingOffsetMs, beatWindowMs);

        if (state.settings.mode === 'countdown') {
          countdownBonus = timingAccuracy * 3;
        } else {
          const baseDelta = (900 + 100 * state.settings.difficulty) * (state.ritmoBpmCurrent / 60);
          ritmoScoreDelta = baseDelta * timingAccuracy;
        }
      }

      const answeredNote: AnsweredNote = state.ritmoCurrentAnswer
        ? {
            note: currentNote,
            responseTimeMs: state.ritmoCurrentAnswer.responseTimeMs,
            correct: true,
            delta: 0,
            timingAccuracy,
            timingOffsetMs,
            missed: false,
            pressedLetter: null,
          }
        : {
            note: currentNote,
            responseTimeMs: 0,
            correct: false,
            delta: 0,
            timingAccuracy: null,
            timingOffsetMs: null,
            missed: true,
            pressedLetter: state.ritmoWrongPressLetter,
          };

      const newAnswered = [...state.answered, answeredNote];
      const newIndex = state.currentIndex + 1;
      const newBeatCount = state.ritmoBeatCount + 1;
      const newCountdownCorrect = state.countdownCorrect + (state.ritmoCurrentAnswer ? 1 : 0);
      const newCountdownSeconds = Math.min(
        state.countdownSecondsLeft + countdownBonus,
        COUNTDOWN_START_SECONDS * 2,
      );

      // BPM acceleration — countdown only, every 16 beats
      let newBpm = state.ritmoBpmCurrent;
      let bpmJustIncreased = false;
      if (state.settings.mode === 'countdown' && beatIndex > 0 && beatIndex % 16 === 0) {
        newBpm = Math.min(
          state.ritmoBpmCurrent + state.settings.ritmoAccelStep,
          RITMO_BPM_MAX_GAMEPLAY,
        );
        bpmJustIncreased = newBpm !== state.ritmoBpmCurrent;
      }

      const base = {
        answered: newAnswered,
        ritmoBeatCount: newBeatCount,
        ritmoBpmCurrent: newBpm,
        ritmoBpmJustIncreased: bpmJustIncreased,
        ritmoCurrentAnswer: null as null,
        ritmoWrongPressLetter: null as null,
        ritmoScore: state.ritmoScore + ritmoScoreDelta,
        countdownCorrect: newCountdownCorrect,
        countdownSecondsLeft: newCountdownSeconds,
        // Offset noteStartTime so beat bar animation starts at ~0% when callback fires
        noteStartTime: beatWallTime + (60000 / state.ritmoBpmCurrent) * RITMO_LATE_WINDOW_FRACTION,
      };

      // Practice: end after NOTES_PER_ROUND
      if (state.settings.mode === 'practice' && newIndex >= NOTES_PER_ROUND) {
        playGameOver();
        return {
          ...state,
          ...base,
          currentIndex: newIndex,
          phase: 'result',
          finalScore: Math.round(base.ritmoScore),
        };
      }

      // Countdown: generate new sequence when round complete
      if (state.settings.mode === 'countdown' && newIndex >= NOTES_PER_ROUND) {
        const pool = buildNotePool(state.settings.clef, state.settings.difficulty);
        const newSeq = generateNoteSequence(pool, NOTES_PER_ROUND);
        return {
          ...state,
          ...base,
          currentIndex: 0,
          noteSequence: newSeq,
        };
      }

      return { ...state, ...base, currentIndex: newIndex };
    }

    case 'TICK': {
      if (state.phase !== 'playing' || state.settings.mode !== 'countdown' || state.paused) return state;
      const newSeconds = state.countdownSecondsLeft - 0.1;
      if (newSeconds <= 0) {
        playGameOver();
        return { ...state, countdownSecondsLeft: 0, phase: 'result', finalScore: state.countdownCorrect };
      }
      return { ...state, countdownSecondsLeft: newSeconds };
    }

    case 'TOGGLE_PAUSE':
      if (state.phase !== 'playing') return state;
      return { ...state, paused: !state.paused };

    case 'RESET':
      return { ...makeInitialState(), settings: state.settings };

    default:
      return state;
  }
}

export function useGameEngine() {
  const [state, dispatch] = useReducer(reducer, undefined, makeInitialState);

  const startGame = useCallback((settings: GameSettings) => {
    dispatch({ type: 'START_GAME', settings });
  }, []);

  const pressKey = useCallback((key: string) => {
    dispatch({ type: 'KEY_PRESSED', key, now: performance.now() });
  }, []);

  const beat = useCallback((beatWallTime: number, beatIndex: number) => {
    dispatch({ type: 'BEAT', beatWallTime, beatIndex });
  }, []);

  const tick = useCallback(() => {
    dispatch({ type: 'TICK', now: performance.now() });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const togglePause = useCallback(() => {
    dispatch({ type: 'TOGGLE_PAUSE' });
  }, []);

  return { state, startGame, pressKey, beat, tick, reset, togglePause };
}
