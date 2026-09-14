import {
  SERIES_TYPES,
  type ChartSeries,
  type SeriesType,
  type TimeSeries,
  type Timestamp,
} from './types';

export const DEFAULT_COLORS: Record<SeriesType, string> = {
  area: '#fff59a',
  bar: '#3b70ff',
  spline: '#078600',
  line: '#bc00f5',
};
export interface NormalizedPoint {
  time: number;
  value: number | null;
}
export interface NormalizedSeries {
  type: SeriesType;
  name: string;
  color: string;
  decimals: number;
  data: NormalizedPoint[];
  values: Map<number, number | null>;
  domain: readonly [number, number];
}

export function parseTime(value: Timestamp): number {
  if (typeof value === 'number') {
    if (Number.isFinite(value) && Math.abs(value) <= 8.64e15) return value;
  } else if (typeof value === 'string') {
    // Reject locale-dependent dates and datetimes without an explicit timezone.
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const time = Date.parse(value + 'T00:00:00Z');
      if (
        Number.isFinite(time) &&
        new Date(time).toISOString().slice(0, 10) === value
      )
        return time;
    } else if (
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/.test(
        value,
      )
    ) {
      const time = Date.parse(value);
      const day = value.slice(0, 10);
      if (
        Number.isFinite(time) &&
        new Date(Date.parse(day + 'T00:00:00Z')).toISOString().slice(0, 10) ===
          day
      )
        return time;
    }
  }
  throw new Error(
    `Некорректная дата: ${String(value)}. Используйте YYYY-MM-DD, ISO с часовым поясом или Unix milliseconds.`,
  );
}

export function autoDomain(
  values: readonly (number | null)[],
): readonly [number, number] {
  let min = 0,
    max = 0;
  for (const value of values)
    if (value !== null) {
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  if (min === max) return [0, 1];
  const step = 10 ** Math.floor(Math.log10((max - min) / 4));
  return [
    min < 0 ? Math.floor((min * 1.12) / step) * step : 0,
    max > 0 ? Math.ceil((max * 1.12) / step) * step : 0,
  ];
}

function normalizeSeries(
  type: SeriesType,
  input: TimeSeries,
): NormalizedSeries {
  const values = new Map<number, number | null>();
  for (const [date, value] of input.data) values.set(parseTime(date), value);
  const data = [...values]
    .sort(([a], [b]) => a - b)
    .map(([time, value]) => ({ time, value }));
  return {
    type,
    name: input.name,
    color: input.color ?? DEFAULT_COLORS[type],
    decimals: input.decimals ?? (type === 'line' ? 0 : 2),
    data,
    values,
    domain: input.yDomain ?? autoDomain(data.map((point) => point.value)),
  };
}

/** Also validates data at the JavaScript / JSON boundary; never mutates input. */
export function validateSeries(input: unknown): asserts input is ChartSeries {
  if (!input || typeof input !== 'object')
    throw new Error('Ожидается объект с рядами area, spline, line и bar.');
  for (const type of SERIES_TYPES) {
    const item: unknown = Reflect.get(input, type);
    if (!item || typeof item !== 'object')
      throw new Error(`Отсутствует ряд ${type}.`);
    const name: unknown = Reflect.get(item, 'name');
    const data: unknown = Reflect.get(item, 'data');
    if (typeof name !== 'string' || !name.trim())
      throw new Error(`${type}.name должен быть непустой строкой.`);
    if (!Array.isArray(data))
      throw new Error(
        `${type}.data должен быть массивом пар [дата, значение].`,
      );
    for (const point of data) {
      if (
        !Array.isArray(point) ||
        point.length !== 2 ||
        (typeof point[0] !== 'number' && typeof point[0] !== 'string') ||
        (point[1] !== null &&
          (typeof point[1] !== 'number' || !Number.isFinite(point[1])))
      )
        throw new Error(
          `${type}: точка должна иметь вид [дата, конечное число или null].`,
        );
      parseTime(point[0]);
    }
    const domain: unknown = Reflect.get(item, 'yDomain');
    if (
      domain !== undefined &&
      (!Array.isArray(domain) ||
        domain.length !== 2 ||
        !domain.every(
          (value) => typeof value === 'number' && Number.isFinite(value),
        ) ||
        domain[0] >= domain[1])
    )
      throw new Error(`${type}.yDomain: нужны два конечных числа, min < max.`);
    const decimals: unknown = Reflect.get(item, 'decimals');
    if (
      decimals !== undefined &&
      (typeof decimals !== 'number' ||
        !Number.isInteger(decimals) ||
        decimals < 0 ||
        decimals > 10)
    )
      throw new Error(`${type}.decimals: целое число от 0 до 10.`);
    const color: unknown = Reflect.get(item, 'color');
    if (
      color !== undefined &&
      (typeof color !== 'string' ||
        !/^#(?:[\da-f]{3}|[\da-f]{6}|[\da-f]{8})$/i.test(color))
    )
      throw new Error(`${type}.color: цвет в формате HEX (#rrggbb).`);
  }
}

export function normalize(series: ChartSeries) {
  validateSeries(series);
  const rows = SERIES_TYPES.map((type) => normalizeSeries(type, series[type]));
  const times = [
    ...new Set(rows.flatMap((row) => row.data.map((point) => point.time))),
  ].sort((a, b) => a - b);
  return { rows, times };
}

export function nearestIndex(times: readonly number[], target: number): number {
  if (!times.length) return -1;
  let left = 0,
    right = times.length - 1;
  while (left < right) {
    const middle = Math.floor((left + right) / 2);
    if (times[middle]! < target) left = middle + 1;
    else right = middle;
  }
  return left > 0 &&
    Math.abs(times[left - 1]! - target) <= Math.abs(times[left]! - target)
    ? left - 1
    : left;
}

export function formatDate(time: number): string {
  const date = new Date(time);
  return `${String(date.getUTCDate()).padStart(2, '0')}.${String(date.getUTCMonth() + 1).padStart(2, '0')}.${date.getUTCFullYear()}`;
}
export function formatValue(
  value: number | null | undefined,
  decimals: number,
): string {
  return value == null ? '—' : value.toFixed(decimals);
}
