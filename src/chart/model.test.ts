import { describe, expect, it } from 'vitest';
import {
  autoDomain,
  formatDate,
  formatValue,
  nearestIndex,
  normalize,
  parseTime,
  validateSeries,
} from './model';
import { referenceSeries } from '../data/reference';
import type { ChartSeries } from './types';

describe('time and input contract', () => {
  it('uses UTC independent of the machine timezone', () => {
    expect(parseTime('2026-06-12')).toBe(Date.UTC(2026, 5, 12));
    expect(parseTime('2026-06-12T03:00:00+03:00')).toBe(
      parseTime('2026-06-12'),
    );
    expect(formatDate(parseTime('2026-06-12'))).toBe('12.06.2026');
  });
  it.each([
    '12.06.2026',
    '2026-02-30',
    '2026-06-12T03:00:00',
    'not a date',
    Infinity,
    NaN,
  ])('rejects invalid or ambiguous time %s', (time) =>
    expect(() => parseTime(time)).toThrow(),
  );
  it('sorts unsorted data, uses the last duplicate, and does not mutate the caller', () => {
    const series: ChartSeries = {
      ...referenceSeries,
      area: {
        name: 'Cost',
        data: [
          ['2026-06-12', 1],
          ['2026-06-10', 2],
          ['2026-06-12', 3],
        ],
      },
    };
    const before = JSON.stringify(series);
    const { rows } = normalize(series);
    expect(rows[0]!.data).toEqual([
      { time: parseTime('2026-06-10'), value: 2 },
      { time: parseTime('2026-06-12'), value: 3 },
    ]);
    expect(JSON.stringify(series)).toBe(before);
  });
  it('keeps null gaps and the union of different date sequences', () => {
    const { times, rows } = normalize({
      ...referenceSeries,
      area: { name: 'Cost', data: [['2026-06-09', null]] },
    });
    expect(times).toHaveLength(6);
    expect(rows[0]!.values.get(times[0]!)).toBeNull();
    expect(rows[0]!.values.has(parseTime('2026-06-10'))).toBe(false);
  });
  it.each([
    {},
    {
      ...referenceSeries,
      line: { name: 'bad', data: [['2026-06-12', Infinity]] },
    },
    { ...referenceSeries, line: { name: 'bad', data: [], yDomain: [1, 1] } },
    { ...referenceSeries, line: { name: 'bad', data: [], decimals: 100 } },
    {
      ...referenceSeries,
      line: { name: 'bad', data: [], color: 'url(https://example.com)' },
    },
  ])('rejects invalid external input %#', (value) =>
    expect(() => validateSeries(value)).toThrow(),
  );
  it('keeps all four independently configured domains', () =>
    expect(normalize(referenceSeries).rows.map((row) => row.domain)).toEqual([
      [0, 75],
      [0, 75],
      [0, 750],
      [0, 120],
    ]));
});

describe('scales and shared selection', () => {
  it('handles empty, all-zero, negative and constant series without zero-length domains', () => {
    for (const values of [[], [null], [0, 0], [-5, -5], [7, 7], [-4, 9]]) {
      const [min, max] = autoDomain(values);
      expect(min).toBeLessThan(max);
      expect(min).toBeLessThanOrEqual(0);
      expect(max).toBeGreaterThanOrEqual(0);
      for (const value of values)
        if (value !== null) {
          expect(value).toBeGreaterThanOrEqual(min);
          expect(value).toBeLessThanOrEqual(max);
        }
    }
  });
  it('selects by elapsed time, clamps edges, and resolves a tie to the earlier date', () => {
    expect(nearestIndex([], 0)).toBe(-1);
    expect(nearestIndex([10, 20, 100], 56)).toBe(1);
    expect(nearestIndex([10, 20, 100], 61)).toBe(2);
    expect(nearestIndex([10, 20], 15)).toBe(0);
    expect(nearestIndex([10, 20], -100)).toBe(0);
    expect(nearestIndex([10, 20], 100)).toBe(1);
  });
  it('distinguishes missing values from zero and preserves tooltip precision', () => {
    expect(formatValue(null, 2)).toBe('—');
    expect(formatValue(undefined, 2)).toBe('—');
    expect(formatValue(0, 2)).toBe('0.00');
    expect(formatValue(180.5, 2)).toBe('180.50');
    expect(formatValue(90, 0)).toBe('90');
  });
});
