import { useState, useEffect, useRef } from 'react';
import type { GameSettings, Clef, GameMode, Accidental, LeaderboardEntry } from '../types';
import { initAudio } from '../utils/audio';
import { getLeaderboardKey, loadLeaderboard } from '../utils/leaderboard';
import {
  RITMO_BPM_DEFAULT,
  RITMO_BPM_MIN,
  RITMO_BPM_MAX,
  RITMO_BPM_STEP,
  RITMO_ACCEL_STEP_DEFAULT,
} from '../constants';
import Leaderboard from './Leaderboard';

interface Props {
  onStart: (settings: GameSettings) => void;
}

const KEY_SIG_OPTIONS = [
  { label: 'Aleatoria', accidental: 'none' as Accidental, count: 0, random: true },
  { label: 'Do mayor', accidental: 'none' as Accidental, count: 0, random: false },
  ...([1,2,3,4,5,6].map(n => ({ label: `${n}♯`, accidental: 'sharp' as Accidental, count: n, random: false }))),
  ...([1,2,3,4,5,6].map(n => ({ label: `${n}♭`, accidental: 'flat' as Accidental, count: n, random: false }))),
];

export default function MainMenu({ onStart }: Props) {
  const [clef, setClef] = useState<Clef>('bass');
  const [keySigIdx, setKeySigIdx] = useState(0);
  const [difficulty, setDifficulty] = useState<0|1|2|3>(0);
  const [mode, setMode] = useState<GameMode>('practice');
  const [rhythmMode, setRhythmMode] = useState(false);
  const [ritmoBpm, setRitmoBpm] = useState(RITMO_BPM_DEFAULT);

  const selectedKeySig = KEY_SIG_OPTIONS[keySigIdx];

  const settings: GameSettings = {
    clef,
    keySignature: { accidental: selectedKeySig.accidental, count: selectedKeySig.count },
    randomKeySignature: selectedKeySig.random,
    difficulty,
    mode,
    rhythmMode,
    ritmoBpm,
    ritmoAccelStep: RITMO_ACCEL_STEP_DEFAULT,
  };

  const lbKey = getLeaderboardKey(settings);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    loadLeaderboard(lbKey).then(setLeaderboard);
  }, [lbKey]);

  const playBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const id = setTimeout(() => playBtnRef.current?.focus(), 150);
    return () => clearTimeout(id);
  }, []);

  function handleStart() {
    initAudio();
    onStart(settings);
  }

  const beatWindowMs = Math.round(60000 / ritmoBpm);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🎼</div>
          <h1 className="text-4xl font-bold text-white tracking-tight">PentaTrainer</h1>
          <p className="text-gray-400 mt-2 text-sm">Entrenamiento de lectura musical</p>
        </div>

        {/* Settings Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-4 space-y-5">

          {/* Clave */}
          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wider mb-2 block">Clave</label>
            <div className="flex gap-2">
              {(['treble', 'bass'] as Clef[]).map(c => (
                <button
                  key={c}
                  onClick={() => setClef(c)}
                  className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    clef === c
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {c === 'treble' ? '𝄞 Sol (Violín)' : '𝄢 Fa (Bajo)'}
                </button>
              ))}
            </div>
          </div>

          {/* Armadura */}
          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wider mb-2 block">Armadura</label>
            <select
              value={keySigIdx}
              onChange={e => setKeySigIdx(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            >
              {KEY_SIG_OPTIONS.map((opt, i) => (
                <option key={i} value={i}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Dificultad */}
          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wider mb-2 block">
              Dificultad — líneas adicionales
            </label>
            <div className="flex gap-2">
              {([0,1,2,3] as (0|1|2|3)[]).map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                    difficulty === d
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {d === 0 ? 'Básico' : `+${d}`}
                </button>
              ))}
            </div>
          </div>

          {/* Tipo de juego */}
          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wider mb-2 block">Tipo de juego</label>
            <div className="flex gap-2">
              <button
                onClick={() => setMode('practice')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  mode === 'practice'
                    ? 'bg-green-600 text-white shadow-lg shadow-green-900/40'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                🎯 Práctica
              </button>
              <button
                onClick={() => setMode('countdown')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  mode === 'countdown'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-900/40'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                ⏱ Contrarreloj
              </button>
            </div>
            {mode === 'countdown' && !rhythmMode && (
              <p className="text-xs text-gray-500 mt-2">
                Empieza con 30s. Cada acierto rápido añade tiempo al reloj.
              </p>
            )}
          </div>

          {/* Enfoque */}
          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wider mb-2 block">Enfoque</label>
            <div className="flex gap-2">
              <button
                onClick={() => setRhythmMode(false)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  !rhythmMode
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                ⚡ Velocidad
              </button>
              <button
                onClick={() => setRhythmMode(true)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  rhythmMode
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-900/40'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                🎵 Ritmo
              </button>
            </div>
          </div>

          {/* BPM slider (only in rhythm mode) */}
          {rhythmMode && (
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wider mb-2 block">
                BPM inicial — ♩ = <span className="text-white font-bold">{ritmoBpm}</span>
                <span className="text-gray-600 font-normal ml-2">({beatWindowMs}ms/nota)</span>
              </label>
              <input
                type="range"
                min={RITMO_BPM_MIN}
                max={RITMO_BPM_MAX}
                step={RITMO_BPM_STEP}
                value={ritmoBpm}
                onChange={e => setRitmoBpm(Number(e.target.value))}
                className="w-full accent-orange-500"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>{RITMO_BPM_MIN}</span>
                <span>{RITMO_BPM_MAX}</span>
              </div>
              {mode === 'countdown' && (
                <p className="text-xs text-gray-500 mt-2">
                  Acelera +{RITMO_ACCEL_STEP_DEFAULT} BPM cada 16 notas
                </p>
              )}
            </div>
          )}
        </div>

        {/* Play Button */}
        <button
          ref={playBtnRef}
          onClick={handleStart}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 text-white font-bold text-lg rounded-2xl transition-all shadow-xl shadow-blue-900/40 active:scale-95"
        >
          ▶ Jugar
        </button>

        {/* Leaderboard preview */}
        <div className="mt-6 bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-3">
            Top 5 — {mode === 'practice' ? 'Práctica' : 'Contrarreloj'}
            {rhythmMode ? ` · Ritmo · ♩ = ${ritmoBpm}` : ''}
            {' · '}Clave {clef === 'treble' ? 'Sol' : 'Fa'} · +{difficulty} líneas
          </h3>
          <Leaderboard entries={leaderboard} />
        </div>
      </div>
    </div>
  );
}
