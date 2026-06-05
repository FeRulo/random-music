import { useCallback, useReducer } from 'react';
import { NOTES_PER_ROUND, COUNTDOWN_START_SECONDS, COUNTDOWN_BONUS_THRESHOLD_S } from '../constants';
import { buildNotePool } from '../utils/noteMapping';
import { generateNoteSequence } from '../utils/noteGenerator';
import { randomKeySignature } from '../utils/keySignature';
import { playNoteFrequency, playWrong, playGameOver } from '../utils/audio';
import type { GameState, GameSettings, AnsweredNote } from '../types';

type Action =
  | { type: 'START_GAME'; settings: GameSettings }
  | { type: 'KEY_PRESSED'; key: string; now: number }
  | { type: 'TICK'; now: number }
  | { type: 'RESET' };

const defaultSettings: GameSettings = {
  clef: 'treble',
  keySignature: { accidental: 'none', count: 0 },
  randomKeySignature: false,
  difficulty: 0,
  mode: 'practice',
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
  };
}

function calcDelta(difficulty: number, responseMs: number): number {
  const secs = Math.max(responseMs / 1000, 0.05);
  return (900 + 100 * difficulty) / secs;
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
      };
    }

    case 'KEY_PRESSED': {
      if (state.phase !== 'playing') return state;
      const { key, now } = action;
      const currentNote = state.noteSequence[state.currentIndex];
      const responseMs = now - state.noteStartTime;
      const correct = key === currentNote.letter;
      const delta = calcDelta(state.settings.difficulty, responseMs);

      const answeredNote: AnsweredNote = {
        note: currentNote,
        responseTimeMs: responseMs,
        correct,
        delta,
      };

      if (correct) {
        playNoteFrequency(currentNote.staffIndex, state.settings.difficulty, state.settings.clef);
      } else {
        playWrong();
      }

      if (state.settings.mode === 'practice') {
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
        // Countdown mode
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
          // Generate a new sequence seamlessly
          const pool = buildNotePool(state.settings.clef, state.settings.difficulty);
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

    case 'TICK': {
      if (state.phase !== 'playing' || state.settings.mode !== 'countdown') return state;
      const newSeconds = state.countdownSecondsLeft - 0.1;
      if (newSeconds <= 0) {
        playGameOver();
        return { ...state, countdownSecondsLeft: 0, phase: 'result', finalScore: state.countdownCorrect };
      }
      return { ...state, countdownSecondsLeft: newSeconds };
    }

    case 'RESET':
      return makeInitialState();

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

  const tick = useCallback(() => {
    dispatch({ type: 'TICK', now: performance.now() });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return { state, startGame, pressKey, tick, reset };
}
