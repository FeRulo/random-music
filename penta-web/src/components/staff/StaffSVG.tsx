import type { NotePosition, Clef, KeySignature } from '../../types';
import { SVG_WIDTH, SVG_HEIGHT, STAFF_X_END, notesStartX, NOTE_SPACING } from './staffConstants';
import { NOTES_PER_ROUND } from '../../constants';
import StaffLines from './StaffLines';
import ClefSymbol from './ClefSymbol';
import KeySignatureAccidentals from './KeySignatureAccidentals';
import NoteHead from './NoteHead';

interface Props {
  clef: Clef;
  keySignature: KeySignature;
  espacios: number;
  noteSequence: NotePosition[];
  currentIndex: number;
  wrongFlash: boolean;
  noteStates?: ('correct' | 'wrong' | 'idle' | 'active')[];
}

export default function StaffSVG({
  clef,
  keySignature,
  espacios,
  noteSequence,
  currentIndex,
  wrongFlash,
  noteStates,
}: Props) {
  const keySigCount = keySignature.accidental === 'none' ? 0 : keySignature.count;
  const notesStart = notesStartX(keySigCount);
  const totalNotesWidth = (NOTES_PER_ROUND - 1) * NOTE_SPACING;
  const leftPad = Math.max(0, (STAFF_X_END - notesStart - totalNotesWidth) / 2);
  const firstNoteX = notesStart + leftPad;

  function getNoteState(i: number): 'idle' | 'active' | 'correct' | 'wrong' {
    if (noteStates) return noteStates[i] ?? 'idle';
    if (i < currentIndex) return 'correct';
    if (i === currentIndex) return wrongFlash ? 'wrong' : 'active';
    return 'idle';
  }

  return (
    <svg
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      width="100%"
      style={{ maxWidth: SVG_WIDTH, display: 'block', margin: '0 auto' }}
      aria-label="Pentagrama musical"
    >
      {/* Fondo del pentagrama */}
      <rect x={0} y={0} width={SVG_WIDTH} height={SVG_HEIGHT} fill="#1a1625" rx={8} />

      <StaffLines />
      <ClefSymbol clef={clef} />
      <KeySignatureAccidentals clef={clef} keySignature={keySignature} />

      {/* Notas */}
      {noteSequence.map((note, i) => {
        const nx = firstNoteX + i * NOTE_SPACING;
        const state = getNoteState(i);
        return (
          <NoteHead
            key={i}
            x={nx}
            staffIndex={note.staffIndex}
            espacios={espacios}
            state={state}
          />
        );
      })}

      {/* Indicador de posición actual (línea vertical punteada) */}
      {!noteStates && currentIndex < noteSequence.length && (
        <line
          x1={firstNoteX + currentIndex * NOTE_SPACING}
          y1={20}
          x2={firstNoteX + currentIndex * NOTE_SPACING}
          y2={SVG_HEIGHT - 20}
          stroke="#60a5fa"
          strokeWidth={1}
          strokeDasharray="4 4"
          opacity={0.3}
        />
      )}
    </svg>
  );
}
