import type { LeaderboardEntry } from '../types';

interface Props {
  entries: LeaderboardEntry[];
  highlightIndex?: number;
}

export default function Leaderboard({ entries, highlightIndex }: Props) {
  if (entries.length === 0) {
    return (
      <p className="text-center text-gray-500 text-sm py-4">
        Sin récords todavía. ¡Sé el primero!
      </p>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-gray-400 border-b border-gray-700">
          <th className="py-2 text-left w-8">#</th>
          <th className="py-2 text-left">Nombre</th>
          <th className="py-2 text-right">Puntos</th>
          <th className="py-2 text-right hidden sm:table-cell">Dificultad</th>
          <th className="py-2 text-right hidden sm:table-cell">Fecha y hora</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e, i) => (
          <tr
            key={i}
            className={`border-b border-gray-800 ${
              i === highlightIndex ? 'bg-yellow-900/30 text-yellow-300' : 'text-gray-200'
            }`}
          >
            <td className="py-2 font-bold text-gray-400">{i + 1}</td>
            <td className="py-2 font-medium">{e.name}</td>
            <td className="py-2 text-right font-mono">{e.score.toLocaleString()}</td>
            <td className="py-2 text-right text-gray-400 hidden sm:table-cell">
              +{e.difficulty} líneas
            </td>
            <td className="py-2 text-right text-gray-500 hidden sm:table-cell">
              {new Date(e.date).toLocaleString('es-CO', {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
