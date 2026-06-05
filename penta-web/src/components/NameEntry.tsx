import { useState } from 'react';

interface Props {
  score: number;
  onSubmit: (name: string) => void;
}

export default function NameEntry({ score, onSubmit }: Props) {
  const [name, setName] = useState('');

  return (
    <div className="bg-yellow-900/20 border border-yellow-600/40 rounded-xl p-6 text-center">
      <div className="text-2xl mb-1">🏆</div>
      <p className="text-yellow-300 font-semibold text-lg mb-1">¡Nuevo récord!</p>
      <p className="text-gray-400 text-sm mb-4">
        {score.toLocaleString()} puntos — ingresa tu nombre
      </p>
      <div className="flex gap-2 justify-center">
        <input
          type="text"
          maxLength={20}
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && name.trim() && onSubmit(name.trim())}
          placeholder="Tu nombre..."
          className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm w-48 focus:outline-none focus:border-yellow-500"
          autoFocus
        />
        <button
          onClick={() => name.trim() && onSubmit(name.trim())}
          className="bg-yellow-600 hover:bg-yellow-500 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Guardar
        </button>
      </div>
    </div>
  );
}
