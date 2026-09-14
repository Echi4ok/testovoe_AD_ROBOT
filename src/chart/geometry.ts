import { area, curveMonotoneX, line } from 'd3-shape';
import type { NormalizedPoint, NormalizedSeries } from './model';

export function createGeometry(
  times: readonly number[],
  width: number,
  height: number,
) {
  const first = times[0] ?? 0;
  const last = times.at(-1) ?? first;
  let interval = Infinity;
  for (let index = 1; index < times.length; index++)
    interval = Math.min(interval, times[index]! - times[index - 1]!);
  if (!Number.isFinite(interval)) interval = 86_400_000;
  const start = first - interval / 2;
  const span = last - first + interval;
  const x = (time: number) => ((time - start) / span) * (width - 2) + 1;
  const timeAt = (pixel: number) => start + ((pixel - 1) / (width - 2)) * span;
  const y = (value: number, domain: readonly [number, number]) =>
    height - 1 - ((value - domain[0]) / (domain[1] - domain[0])) * (height - 2);
  return {
    x,
    y,
    timeAt,
    barWidth: Math.min(38, Math.max(1, (interval / span) * width * 0.32)),
  };
}
export type Geometry = ReturnType<typeof createGeometry>;

export function seriesPath(row: NormalizedSeries, geometry: Geometry): string {
  const path = line<NormalizedPoint>()
    .defined((point) => point.value !== null)
    .x((point) => geometry.x(point.time))
    .y((point) => geometry.y(point.value!, row.domain));
  if (row.type === 'spline') path.curve(curveMonotoneX);
  return path(row.data) ?? '';
}

export function areaPath(row: NormalizedSeries, geometry: Geometry): string {
  const baseline = Math.max(row.domain[0], Math.min(row.domain[1], 0));
  return (
    area<NormalizedPoint>()
      .defined((point) => point.value !== null)
      .x((point) => geometry.x(point.time))
      .y0(geometry.y(baseline, row.domain))
      .y1((point) => geometry.y(point.value!, row.domain))(row.data) ?? ''
  );
}
