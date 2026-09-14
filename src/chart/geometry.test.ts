import { describe, expect, it } from 'vitest';
import { areaPath, createGeometry, seriesPath } from './geometry';
import { normalize } from './model';
import { referenceSeries } from '../data/reference';

describe('rendering geometry', () => {
  it('positions reference dates and independently scaled values within one pixel of the GIF', () => {
    const { rows, times } = normalize(referenceSeries);
    const geometry = createGeometry(times, 592, 296);
    expect(geometry.x(times[0]!)).toBeCloseTo(60, 0);
    expect(geometry.x(times[4]!)).toBeCloseTo(532, 0);
    expect(geometry.y(610.78, rows[2]!.domain)).toBeCloseTo(55.57, 1);
    expect(geometry.y(1.23, rows[1]!.domain)).toBeCloseTo(290.18, 1);
    expect(geometry.y(90, rows[3]!.domain)).toBe(74.5);
  });
  it('preserves proportional spacing for irregular timestamps', () => {
    const geometry = createGeometry([0, 10, 100], 592, 296);
    expect(
      (geometry.x(100) - geometry.x(10)) / (geometry.x(10) - geometry.x(0)),
    ).toBeCloseTo(9);
    expect(geometry.timeAt(geometry.x(42))).toBeCloseTo(42);
  });
  it('centers one point without division by zero', () => {
    const geometry = createGeometry([100], 592, 296);
    expect(geometry.x(100)).toBe(296);
  });
  it('renders a curve for spline, straight line segments for line and a closed area', () => {
    const { rows, times } = normalize(referenceSeries);
    const geometry = createGeometry(times, 592, 296);
    expect(seriesPath(rows[2]!, geometry)).toContain('C');
    expect(seriesPath(rows[3]!, geometry)).not.toContain('C');
    expect(areaPath(rows[0]!, geometry)).toMatch(/Z$/);
  });
  it('splits paths at explicit gaps and never invents a value', () => {
    const { rows, times } = normalize({
      ...referenceSeries,
      line: {
        name: 'Gaps',
        data: [
          [0, 2],
          [10, null],
          [20, 3],
          [30, 4],
        ],
      },
    });
    const path = seriesPath(rows[3]!, createGeometry(times, 592, 296));
    expect(path.match(/M/g)).toHaveLength(2);
    expect(path).not.toMatch(/NaN|Infinity/);
  });
});
