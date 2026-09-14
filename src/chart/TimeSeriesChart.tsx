import {
  useId,
  useMemo,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import { ChartTooltip } from './ChartTooltip';
import { areaPath, createGeometry, seriesPath } from './geometry';
import {
  formatDate,
  formatValue,
  nearestIndex,
  normalize,
  type NormalizedSeries,
} from './model';
import type { SeriesType, TimeSeriesChartProps } from './types';
import { useElementSize } from './useElementSize';
import './chart.css';

interface ActivePoint {
  time: number;
  x: number;
  y: number;
  series: SeriesType | null;
}

function Marker({
  row,
  x,
  y,
  active,
}: {
  row: NormalizedSeries;
  x: number;
  y: number;
  active: boolean;
}) {
  const stroke = active ? '#ffffff' : row.color;
  const size = active ? 4 : row.type === 'line' ? 6 : 1.2;
  if (row.type === 'line')
    return (
      <rect
        x={x - size}
        y={y - size}
        width={size * 2}
        height={size * 2}
        fill={row.color}
        stroke={stroke}
        strokeWidth={active ? 1.5 : 0}
      />
    );
  if (row.type === 'spline')
    return (
      <path
        d={`M${x},${y - size}l${size},${size}l-${size},${size}l-${size},-${size}Z`}
        fill={row.color}
        stroke={stroke}
        strokeWidth={active ? 1.5 : 0}
      />
    );
  return (
    <circle
      cx={x}
      cy={y}
      r={size}
      fill={row.color}
      stroke={stroke}
      strokeWidth={active ? 1.5 : 0}
    />
  );
}

/** Four independent time series, one continuous time axis and shared tooltip. */
export function TimeSeriesChart({
  series,
  hiddenSeries = [],
  height = 296,
  ariaLabel = 'Cost, CPA, ROI confirmed и Conversions по времени',
  onActiveDateChange,
}: TimeSeriesChartProps) {
  const id = useId();
  const size = useElementSize<HTMLDivElement>({ width: 592, height });
  const width = Math.max(size.width, 1);
  const model = useMemo(() => normalize(series), [series]);
  const rows = model.rows.filter((row) => !hiddenSeries.includes(row.type));
  const geometry = useMemo(
    () => createGeometry(model.times, Math.max(width, 3), height),
    [model.times, width, height],
  );
  const [selected, setSelected] = useState<ActivePoint | null>(null);
  const hasData = rows.some((row) =>
    row.data.some((point) => point.value !== null),
  );
  const active =
    selected && hasData && model.times.includes(selected.time)
      ? selected
      : null;

  function select(next: ActivePoint | null) {
    setSelected(next);
    if (next?.time !== selected?.time) onActiveDateChange?.(next?.time ?? null);
  }

  function handlePointer(event: PointerEvent<HTMLDivElement>) {
    if (!hasData) return;
    if (event.type === 'pointerdown')
      event.currentTarget.focus({ preventScroll: true });
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const time = model.times[nearestIndex(model.times, geometry.timeAt(x))];
    if (time === undefined) return;
    const hit =
      event.target instanceof SVGElement
        ? event.target.closest<SVGElement>('[data-series]')?.dataset.series
        : undefined;
    const hovered = rows.find((row) => row.type === hit)?.type ?? null;
    select({ time, x, y, series: hovered });
  }

  function handleKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      select(null);
      return;
    }
    if (
      !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) ||
      !hasData
    )
      return;
    event.preventDefault();
    const index = active ? model.times.indexOf(active.time) : -1;
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? model.times.length - 1
          : Math.max(
              0,
              Math.min(
                model.times.length - 1,
                index + (event.key === 'ArrowLeft' ? -1 : 1),
              ),
            );
    const time = model.times[next];
    if (time !== undefined)
      select({ time, x: geometry.x(time), y: height - 12, series: null });
  }

  return (
    <div
      ref={size.ref}
      className="ts-chart"
      role="group"
      aria-roledescription="интерактивный график"
      aria-label={ariaLabel}
      aria-describedby={`${id}-help`}
      tabIndex={0}
      style={{ height }}
      onPointerMove={handlePointer}
      onPointerDown={handlePointer}
      onPointerLeave={(event) => {
        if (event.pointerType !== 'touch') select(null);
      }}
      onPointerCancel={() => select(null)}
      onBlur={() => select(null)}
      onKeyDown={handleKey}
    >
      <span id={`${id}-help`} className="ts-sr-only">
        Для просмотра значений наведите указатель или нажмите стрелки влево и
        вправо. Home и End — первая и последняя дата, Escape — закрыть
        подсказку.
      </span>
      <svg
        className="ts-svg"
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden="true"
      >
        <defs>
          <clipPath id={`${id}-clip`}>
            <rect
              x="1"
              y="1"
              width={Math.max(0, width - 2)}
              height={height - 1}
            />
          </clipPath>
        </defs>
        <rect
          x="0.75"
          y="0.75"
          width={Math.max(0, width - 1.5)}
          height={height - 1.5}
          fill="none"
          stroke="#c7c7bf"
          strokeWidth="1.5"
        />
        <g clipPath={`url(#${id}-clip)`}>
          {rows
            .filter((row) => row.type === 'area')
            .map((row) => (
              <g key={row.type} data-series={row.type}>
                <path
                  className="ts-area"
                  d={areaPath(row, geometry)}
                  fill={row.color}
                  fillOpacity="0.55"
                />
                <path
                  d={seriesPath(row, geometry)}
                  stroke={row.color}
                  strokeWidth="1"
                  fill="none"
                />
              </g>
            ))}
          {rows
            .filter((row) => row.type === 'bar')
            .map((row) => (
              <g key={row.type} data-series={row.type}>
                {row.data.map((point) => {
                  if (point.value === null) return null;
                  const baseline = geometry.y(
                    Math.max(row.domain[0], Math.min(row.domain[1], 0)),
                    row.domain,
                  );
                  const y = geometry.y(point.value, row.domain);
                  return (
                    <rect
                      key={point.time}
                      x={geometry.x(point.time) - geometry.barWidth / 2}
                      y={Math.min(y, baseline)}
                      width={geometry.barWidth}
                      height={Math.abs(baseline - y)}
                      rx="4"
                      fill={row.color}
                      stroke="white"
                      strokeWidth="1.5"
                    />
                  );
                })}
              </g>
            ))}
          {rows
            .filter((row) => row.type === 'spline' || row.type === 'line')
            .map((row) => (
              <g key={row.type} data-series={row.type}>
                <path
                  className="ts-line"
                  d={seriesPath(row, geometry)}
                  fill="none"
                  stroke={row.color}
                  strokeWidth={
                    active?.series === row.type
                      ? row.type === 'spline'
                        ? 5
                        : 3
                      : 1.6
                  }
                  strokeLinecap="round"
                />
                <path
                  d={seriesPath(row, geometry)}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="16"
                />
              </g>
            ))}
          {rows
            .filter((row) => row.type !== 'bar')
            .map((row) => (
              <g key={row.type} data-series={row.type}>
                {row.data.map(
                  (point) =>
                    point.value !== null && (
                      <Marker
                        key={point.time}
                        row={row}
                        x={geometry.x(point.time)}
                        y={geometry.y(point.value, row.domain)}
                        active={false}
                      />
                    ),
                )}
              </g>
            ))}
          {active &&
            rows
              .filter((row) => row.type !== 'bar')
              .map((row) => {
                const value = row.values.get(active.time);
                if (value == null) return null;
                const x = geometry.x(active.time),
                  y = geometry.y(value, row.domain);
                return (
                  <g
                    key={row.type}
                    className="ts-highlight"
                    data-active-series={row.type}
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r="20"
                      fill={row.color}
                      opacity="0.18"
                    />
                    <Marker row={row} x={x} y={y} active />
                  </g>
                );
              })}
        </g>
      </svg>
      {!hasData && (
        <div className="ts-empty">
          <span className="ts-empty-icon">∿</span>
          <strong>
            {rows.length === 0 ? 'Все ряды скрыты' : 'Пока нет данных'}
          </strong>
          <span>
            {rows.length === 0
              ? 'Включите ряд с помощью легенды.'
              : 'Передайте хотя бы одну точку с числом.'}
          </span>
        </div>
      )}
      {active && (
        <ChartTooltip
          id={`${id}-tooltip`}
          time={active.time}
          rows={rows}
          anchor={active}
          width={width}
          height={height}
        />
      )}
      <span
        className="ts-sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {active
          ? `${formatDate(active.time)}. ${rows.map((row) => `${row.name}: ${formatValue(row.values.get(active.time), row.decimals)}`).join('. ')}`
          : ''}
      </span>
    </div>
  );
}
