import { LINE5_Y, STEP, STAFF_X_START, STAFF_X_END } from './staffConstants';

export default function StaffLines() {
  const lines = [0, 2, 4, 6, 8].map(i => LINE5_Y + i * STEP);
  return (
    <g stroke="#d4c9a8" strokeWidth={1.5}>
      {lines.map(y => (
        <line key={y} x1={STAFF_X_START} y1={y} x2={STAFF_X_END} y2={y} />
      ))}
    </g>
  );
}
