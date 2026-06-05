import type { Clef, KeySignature } from '../../types';
import { getKeySignaturePositions } from '../../utils/keySignature';
import { KEYSIG_START_X, KEYSIG_SPACING, STEP, LINE5_Y } from './staffConstants';

interface Props {
  clef: Clef;
  keySignature: KeySignature;
}

export default function KeySignatureAccidentals({ clef, keySignature }: Props) {
  const positions = getKeySignaturePositions(clef, keySignature);
  if (positions.length === 0) return null;

  const symbol = keySignature.accidental === 'sharp' ? '♯' : '♭';

  return (
    <g fill="#f0e8d0" fontSize={16} fontFamily="serif" style={{ userSelect: 'none' }}>
      {positions.map((pos, i) => {
        const y = LINE5_Y + pos * STEP;
        const x = KEYSIG_START_X + i * KEYSIG_SPACING;
        return (
          <text
            key={i}
            x={x}
            y={y + 6}
            textAnchor="middle"
          >
            {symbol}
          </text>
        );
      })}
    </g>
  );
}
