import { useState, useEffect, useRef } from 'react';
import type { GameState, LeaderboardEntry } from '../types';
import { NOTES_PER_ROUND } from '../constants';
import StaffSVG from './staff/StaffSVG';
import {
  getLeaderboardKey, loadLeaderboard, insertEntry,
  saveLeaderboardLocal, isTopScore,
} from '../utils/leaderboard';
import { apiSaveEntry } from '../utils/leaderboardApi';
import Leaderboard from './Leaderboard';
import NameEntry from './NameEntry';

interface Props {
  state: GameState;
  onPlayAgain: () => void;
  onMenu: () => void;
}

export default function ResultScreen({ state, onPlayAgain, onMenu }: Props) {
  const { settings, answered, countdownCorrect } = state;
  const isPractice = settings.mode === 'practice';
  const score = state.finalScore ?? (isPractice ? 0 : countdownCorrect);

  const correct = answered.filter(a => a.correct).length;
  const wrong = answered.filter(a => !a.correct).length;
  const avgTime = answered.length
    ? Math.round(answered.reduce((s, a) => s + a.responseTimeMs, 0) / answered.length / 100) / 10
    : 0;

  const lbKey = getLeaderboardKey(settings);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [lbLoading, setLbLoading] = useState(true);
  const [newEntryIndex, setNewEntryIndex] = useState<number | undefined>(undefined);
  const [nameSaved, setNameSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLbLoading(true);
    loadLeaderboard(lbKey).then(loaded => {
      if (!cancelled) {
        setEntries(loaded);
        setLbLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [lbKey]);

  const needsName = !lbLoading && isTopScore(entries, score) && !nameSaved;
  const playAgainRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!needsName && !lbLoading) {
      const id = setTimeout(() => playAgainRef.current?.focus(), 150);
      return () => clearTimeout(id);
    }
  }, [needsName, lbLoading]);

  function handleName(name: string) {
    const newEntry: LeaderboardEntry = {
      name,
      score,
      date: new Date().toISOString(),
      difficulty: settings.difficulty,
      clef: settings.clef,
      keySignature: settings.keySignature,
      mode: settings.mode,
    };
    const updated = insertEntry(entries, newEntry);
    saveLeaderboardLocal(lbKey, updated);
    setEntries(updated);
    setNewEntryIndex(updated.findIndex(e => e === newEntry));
    setNameSaved(true);
    apiSaveEntry(lbKey, newEntry).catch(() => {/* servidor no disponible, ya guardado en localStorage */});
  }

  const diffLabel = settings.difficulty === 0 ? 'Básico' : `+${settings.difficulty} líneas`;
  const clefLabel = settings.clef === 'treble' ? '𝄞 Sol' : '𝄢 Fa';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 flex flex-col items-center justify-start py-8 px-4">

      {/* Note summary — full width, same as gameplay */}
      {answered.length > 0 && (() => {
        const chunks: typeof answered[] = [];
        for (let i = 0; i < answered.length; i += NOTES_PER_ROUND) {
          chunks.push(answered.slice(i, i + NOTES_PER_ROUND));
        }
        return (
          <div className="w-full max-w-5xl mb-6">
            <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-3 px-1">
              Resumen de notas
            </h3>
            {chunks.map((chunk, ci) => (
              <div key={ci} className="mb-3 rounded-2xl overflow-hidden">
                <StaffSVG
                  clef={settings.clef}
                  keySignature={settings.keySignature}
                  espacios={settings.difficulty}
                  noteSequence={chunk.map(a => a.note)}
                  currentIndex={chunk.length}
                  wrongFlash={false}
                  noteStates={chunk.map(a => a.correct ? 'correct' : 'wrong')}
                />
              </div>
            ))}
          </div>
        );
      })()}

      <div className="w-full max-w-md">
        {/* Score */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">{isPractice ? '🎯' : '⏱'}</div>
          <h2 className="text-3xl font-bold text-white">
            {isPractice ? 'Ronda completada' : 'Tiempo agotado'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">{clefLabel} · {diffLabel}</p>
          <div className="mt-4">
            <span className="text-6xl font-mono font-bold text-blue-400">
              {score.toLocaleString()}
            </span>
            <span className="text-gray-500 ml-2">{isPractice ? 'puntos' : 'aciertos'}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <div className="text-green-400 font-bold text-xl">{correct}</div>
            <div className="text-gray-500 text-xs">Correctas</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <div className="text-red-400 font-bold text-xl">{wrong}</div>
            <div className="text-gray-500 text-xs">Errores</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <div className="text-yellow-400 font-bold text-xl">{avgTime}s</div>
            <div className="text-gray-500 text-xs">Tiempo/nota</div>
          </div>
        </div>

        {/* Record entry */}
        {needsName && (
          <div className="mb-6">
            <NameEntry score={score} onSubmit={handleName} />
          </div>
        )}

        {/* Leaderboard */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-6">
          <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-3">
            Top 5 — {settings.mode === 'practice' ? 'Práctica' : 'Contrarreloj'}
          </h3>
          <Leaderboard entries={entries} highlightIndex={newEntryIndex} />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            ref={playAgainRef}
            onClick={onPlayAgain}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 text-white font-semibold rounded-xl transition-all"
          >
            ▶ Jugar de nuevo
          </button>
          <button
            onClick={onMenu}
            className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-xl transition-all"
          >
            ← Menú
          </button>
        </div>
      </div>
    </div>
  );
}
