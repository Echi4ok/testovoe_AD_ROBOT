import type { CSSProperties } from 'react';
import { formatDate, formatValue, type NormalizedSeries } from './model';
import { useElementSize } from './useElementSize';

interface Props {
  id: string;
  time: number;
  rows: readonly NormalizedSeries[];
  anchor: { x: number; y: number };
  width: number;
  height: number;
}

export function ChartTooltip({ id, time, rows, anchor, width, height }: Props) {
  const box = useElementSize<HTMLDivElement>({ width: 334, height: 178 });
  const preferredX = anchor.x + 28;
  const leftX = anchor.x - box.width - 28;
  // Center over the pointer if a wide shared tooltip fits on neither side.
  const proposedX =
    preferredX + box.width <= width
      ? preferredX
      : leftX >= 0
        ? leftX
        : anchor.x - box.width / 2;
  const x = Math.max(2, Math.min(width - box.width - 2, proposedX));
  const y = Math.max(
    4,
    Math.min(height - box.height - 3, anchor.y - box.height - 22),
  );
  return (
    <div
      id={id}
      ref={box.ref}
      role="tooltip"
      className="ts-tooltip"
      style={
        {
          left: x,
          top: y,
          '--tooltip-max': `${Math.max(0, width - 4)}px`,
        } as CSSProperties
      }
    >
      <div className="ts-tooltip-date">{formatDate(time)}</div>
      {rows.map((row) => (
        <div className="ts-tooltip-row" key={row.type}>
          <span
            className="ts-tooltip-dot"
            style={{ backgroundColor: row.color }}
          />
          <span className="ts-tooltip-label">
            {row.name}:{' '}
            <strong>{formatValue(row.values.get(time), row.decimals)}</strong>
          </span>
        </div>
      ))}
    </div>
  );
}
