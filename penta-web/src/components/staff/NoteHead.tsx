import {
  NOTE_RX, NOTE_RY, NOTE_ROTATION, STEM_LENGTH,
  LEDGER_HALF,
  noteY,
} from './staffConstants';

interface Props {
  x: number;
  staffIndex: number;
  espacios: number;
  state: 'idle' | 'active' | 'correct' | 'wrong';
}

const COLORS = {
  idle: '#1e1e2e',
  active: '#60a5fa',    // blue
  correct: '#4ade80',   // green
  wrong: '#f87171',     // red
};

const OUTLINE_COLORS = {
  idle: '#d4c9a8',
  active: '#93c5fd',
  correct: '#86efac',
  wrong: '#fca5a5',
};

export default function NoteHead({ x, staffIndex, espacios, state }: Props) {
  const y = noteY(staffIndex, espacios);
  const fill = COLORS[state];
  const stroke = OUTLINE_COLORS[state];

  // Middle line is at staffIndex = espacios + 4 (line 3)
  const middleLine = espacios + 4;
  // Stem goes UP when note is at or below middle, DOWN when above
  const stemUp = staffIndex >= middleLine;

  const stemX = stemUp ? x + NOTE_RX - 1 : x - NOTE_RX + 1;
  const stemY1 = y;
  const stemY2 = stemUp ? y - STEM_LENGTH : y + STEM_LENGTH;

  // Ledger lines: only drawn on even positions outside the staff
  // Staff occupies positions espacios to espacios+8
  const staffTop = espacios;
  const staffBottom = espacios + 8;

  const ledgerLines: number[] = [];
  if (staffIndex < staffTop) {
    for (let p = staffTop - 2; p >= staffIndex; p -= 2) {
      ledgerLines.push(p);
    }
  } else if (staffIndex > staffBottom) {
    for (let p = staffBottom + 2; p <= staffIndex; p += 2) {
      ledgerLines.push(p);
    }
  }

  return (
    <g>
      {/* Ledger lines */}
      {ledgerLines.map(p => {
        const ly = noteY(p, espacios);
        return (
          <line
            key={p}
            x1={x - LEDGER_HALF}
            y1={ly}
            x2={x + LEDGER_HALF}
            y2={ly}
            stroke="#d4c9a8"
            strokeWidth={1.5}
          />
        );
      })}

      {/* Stem */}
      <line
        x1={stemX}
        y1={stemY1}
        x2={stemX}
        y2={stemY2}
        stroke={state === 'idle' ? '#d4c9a8' : stroke}
        strokeWidth={1.5}
      />

      {/* Note head ellipse */}
      <ellipse
        cx={x}
        cy={y}
        rx={NOTE_RX}
        ry={NOTE_RY}
        fill={fill}
        stroke={stroke}
        strokeWidth={state === 'active' ? 2 : 1}
        transform={`rotate(${NOTE_ROTATION}, ${x}, ${y})`}
      />

      {/* Active pulse ring */}
      {state === 'active' && (
        <ellipse
          cx={x}
          cy={y}
          rx={NOTE_RX + 5}
          ry={NOTE_RY + 4}
          fill="none"
          stroke="#60a5fa"
          strokeWidth={1.5}
          opacity={0.5}
          transform={`rotate(${NOTE_ROTATION}, ${x}, ${y})`}
        />
      )}
    </g>
  );
}
