import { useState, useEffect } from 'react';
import type { GameState } from '../types';
import { NOTES_PER_ROUND, SOLFEO, COUNTDOWN_START_SECONDS } from '../constants';
import { useKeyboard } from '../hooks/useKeyboard';
import { useCountdown } from '../hooks/useCountdown';
import StaffSVG from './staff/StaffSVG';
import { initAudio } from '../utils/audio';

interface Props {
  state: GameState;
  onKey: (key: string) => void;
  onTick: () => void;
}

const NOTE_KEYS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

export default function GameScreen({ state, onKey, onTick }: Props) {
  const { settings, noteSequence, currentIndex, answered, countdownSecondsLeft, countdownCorrect } = state;
  const isPlaying = state.phase === 'playing';
  const isCountdown = settings.mode === 'countdown';

  useKeyboard(onKey, isPlaying);
  useCountdown(isPlaying && isCountdown, onTick);

  // Wrong-answer flash: briefly show active note in red
  const [wrongFlash, setWrongFlash] = useState(false);
  const answeredLen = answered.length;
  useEffect(() => {
    if (answeredLen === 0) return;
    const last = answered[answeredLen - 1];
    if (!last.correct) {
      setWrongFlash(true);
      const t = setTimeout(() => setWrongFlash(false), 350);
      return () => clearTimeout(t);
    }
  }, [answeredLen]);

  // Progress for practice mode
  const progress = Math.round((currentIndex / NOTES_PER_ROUND) * 100);

  // Timer color
  const timerColor =
    countdownSecondsLeft > 15 ? '#4ade80' :
    countdownSecondsLeft > 7  ? '#facc15' : '#f87171';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="text-sm text-gray-400">
          <span className="text-white font-medium">
            {settings.clef === 'treble' ? '𝄞 Sol' : '𝄢 Fa'}
          </span>
          {settings.keySignature.count > 0 && (
            <span className="ml-2 text-gray-500">
              {settings.keySignature.count}{settings.keySignature.accidental === 'sharp' ? '♯' : '♭'}
            </span>
          )}
          <span className="ml-2 text-gray-600">+{settings.difficulty} líneas</span>
        </div>

        {isCountdown ? (
          <div className="text-2xl font-mono font-bold" style={{ color: timerColor }}>
            {Math.max(0, countdownSecondsLeft).toFixed(1)}s
          </div>
        ) : (
          <div className="text-sm text-gray-400">
            Nota <span className="text-white font-bold">{currentIndex + 1}</span> / {NOTES_PER_ROUND}
          </div>
        )}

        {isCountdown && (
          <div className="text-sm text-gray-400">
            <span className="text-green-400 font-bold">{countdownCorrect}</span> correctas
          </div>
        )}
      </div>

      {/* Progress bar (practice mode) */}
      {!isCountdown && (
        <div className="h-1 bg-gray-800">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Countdown bar */}
      {isCountdown && (
        <div className="h-1 bg-gray-800">
          <div
            className="h-full transition-all duration-100"
            style={{
              width: `${Math.max(0, (countdownSecondsLeft / COUNTDOWN_START_SECONDS) * 100)}%`,
              backgroundColor: timerColor,
            }}
          />
        </div>
      )}

      {/* Staff */}
      <div className="px-2 pt-4 pb-2">
        <StaffSVG
          clef={settings.clef}
          keySignature={settings.keySignature}
          espacios={settings.difficulty}
          noteSequence={noteSequence}
          currentIndex={currentIndex}
          wrongFlash={wrongFlash}
        />
      </div>

      {/* Current note hint */}
      <div className="text-center py-2">
        <p className="text-gray-600 text-xs">Identifica la nota activa (azul)</p>
      </div>

      {/* Virtual keyboard buttons (for mobile/touch) */}
      <div className="flex justify-center gap-1.5 px-4 py-3 mt-auto">
        {NOTE_KEYS.map(k => (
          <button
            key={k}
            onClick={() => { initAudio(); onKey(k); }}
            className="flex-1 max-w-12 aspect-square rounded-xl bg-gray-800 hover:bg-gray-700 active:bg-blue-700 text-white font-bold text-sm transition-colors border border-gray-700 flex flex-col items-center justify-center"
          >
            <span>{k}</span>
            <span className="text-gray-500 text-xs leading-none">{SOLFEO[k]}</span>
          </button>
        ))}
      </div>

      {/* Last feedback */}
      {answered.length > 0 && (
        <div className="text-center pb-4">
          {(() => {
            const last = answered[answered.length - 1];
            return (
              <span className={`text-sm font-medium ${last.correct ? 'text-green-400' : 'text-red-400'}`}>
                {last.correct
                  ? `✔ Correcto · +${Math.round(last.delta)} pts`
                  : `✘ Era ${last.note.letter} (${SOLFEO[last.note.letter]})`}
              </span>
            );
          })()}
        </div>
      )}
    </div>
  );
}
