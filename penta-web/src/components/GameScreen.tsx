import { useState, useEffect, useRef, useCallback } from 'react';
import type { GameState } from '../types';
import { NOTES_PER_ROUND, SOLFEO, COUNTDOWN_START_SECONDS } from '../constants';
import { useKeyboard } from '../hooks/useKeyboard';
import { useCountdown } from '../hooks/useCountdown';
import { useMetronome } from '../hooks/useMetronome';
import StaffSVG from './staff/StaffSVG';
import { initAudio, playBpmIncrease } from '../utils/audio';

interface Props {
  state: GameState;
  onKey: (key: string) => void;
  onBeat: (beatWallTime: number, beatIndex: number) => void;
  onTick: () => void;
  onMenu: () => void;
}

const NOTE_KEYS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

function timingLabel(accuracy: number): string {
  if (accuracy > 0.85) return '🎯 Perfecto';
  if (accuracy >= 0.5)  return '👍 Bien';
  return '⏰ Tarde';
}

export default function GameScreen({ state, onKey, onBeat, onTick, onMenu }: Props) {
  const { settings, noteSequence, currentIndex, answered, countdownSecondsLeft, countdownCorrect } = state;
  const isPlaying = state.phase === 'playing';
  const isCountdown = settings.mode === 'countdown';
  const isRhythm = settings.rhythmMode;

  useKeyboard(onKey, isPlaying, onMenu);
  useCountdown(isPlaying && isCountdown, onTick);

  // Metronome (rhythm mode only)
  const stableOnBeat = useCallback(
    (beatWallTime: number, beatIndex: number) => onBeat(beatWallTime, beatIndex),
    [onBeat],
  );
  useMetronome(isPlaying && isRhythm, state.ritmoBpmCurrent, { onBeat: stableOnBeat });

  // BPM increase audio side-effect
  const prevBpmRef = useRef(state.ritmoBpmCurrent);
  useEffect(() => {
    if (isRhythm && state.ritmoBpmCurrent !== prevBpmRef.current) {
      playBpmIncrease();
    }
    prevBpmRef.current = state.ritmoBpmCurrent;
  }, [isRhythm, state.ritmoBpmCurrent]);

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

  // Beat progress bar (rhythm mode) — animated via rAF
  const beatBarRef = useRef<HTMLDivElement>(null);
  const bpmRefForBar = useRef(state.ritmoBpmCurrent);
  const noteStartRefForBar = useRef(state.noteStartTime);
  bpmRefForBar.current = state.ritmoBpmCurrent;
  noteStartRefForBar.current = state.noteStartTime;

  useEffect(() => {
    if (!isRhythm || !isPlaying) return;
    let rafId: number;
    const animate = () => {
      if (beatBarRef.current) {
        const beatWindowMs = 60000 / bpmRefForBar.current;
        const elapsed = performance.now() - noteStartRefForBar.current;
        const progress = Math.min(1, Math.max(0, elapsed / beatWindowMs));
        beatBarRef.current.style.width = `${progress * 100}%`;
      }
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [isRhythm, isPlaying]);

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
        <div className="flex items-center gap-3">
          <button
            onClick={onMenu}
            className="text-gray-600 hover:text-gray-300 text-xs transition-colors"
            title="Volver al menú (Esc)"
          >
            ← Menú
          </button>
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
        </div>

        {/* Center: BPM (rhythm) or note count (practice velocity) */}
        {isRhythm ? (
          <div
            className={`text-xl font-mono font-bold transition-colors duration-150 ${
              state.ritmoBpmJustIncreased ? 'text-yellow-300' : 'text-orange-400'
            }`}
          >
            ♩ = {state.ritmoBpmCurrent}
          </div>
        ) : isCountdown ? null : (
          <div className="text-sm text-gray-400">
            Nota <span className="text-white font-bold">{currentIndex + 1}</span> / {NOTES_PER_ROUND}
          </div>
        )}

        {/* Right: timer (countdown) or blank */}
        {isCountdown && (
          <div className="flex items-center gap-3">
            {isRhythm && (
              <div className="text-sm text-gray-400">
                <span className="text-green-400 font-bold">{countdownCorrect}</span> correctas
              </div>
            )}
            <div className="text-2xl font-mono font-bold" style={{ color: timerColor }}>
              {Math.max(0, countdownSecondsLeft).toFixed(1)}s
            </div>
            {!isRhythm && (
              <div className="text-sm text-gray-400">
                <span className="text-green-400 font-bold">{countdownCorrect}</span> correctas
              </div>
            )}
          </div>
        )}
      </div>

      {/* Progress bar (practice velocity) */}
      {!isCountdown && !isRhythm && (
        <div className="h-1 bg-gray-800">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Countdown bar (velocity) */}
      {isCountdown && !isRhythm && (
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

      {/* Beat progress bar (rhythm mode) */}
      {isRhythm && (
        <div className="h-0.5 bg-gray-800 relative">
          <div
            ref={beatBarRef}
            className="h-full bg-amber-400 absolute left-0 top-0"
            style={{ width: '0%' }}
          />
        </div>
      )}

      {/* Staff */}
      <div className="px-2 pt-4 pb-2 max-w-[920px] w-full mx-auto">
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
        {isRhythm ? (
          <p className="text-gray-600 text-xs">Presiona la tecla correcta antes del siguiente beat</p>
        ) : (
          <p className="text-gray-600 text-xs">Identifica la nota activa (azul)</p>
        )}
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
            if (isRhythm) {
              if (last.missed) {
                return (
                  <span className="text-red-400 text-sm font-medium">
                    ✘ Miss — Era {last.note.letter} ({SOLFEO[last.note.letter]})
                  </span>
                );
              }
              if (last.correct && last.timingAccuracy !== null) {
                if (settings.mode === 'practice') {
                  const bpm = state.ritmoBpmCurrent;
                  const baseDelta = (900 + 100 * settings.difficulty) * (bpm / 60);
                  const pts = Math.round(baseDelta * last.timingAccuracy);
                  return (
                    <span className="text-green-400 text-sm font-medium">
                      ✔ Correcto · +{pts.toLocaleString()} pts · {timingLabel(last.timingAccuracy)}
                    </span>
                  );
                }
                return (
                  <span className="text-green-400 text-sm font-medium">
                    ✔ Correcto · {timingLabel(last.timingAccuracy)}
                  </span>
                );
              }
            }
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
