import type { ChartSeries } from '../chart';

/** Values transcribed from all five tooltips in the supplied GIF. */
export const referenceSeries = {
  area: {
    name: 'Cost',
    yDomain: [0, 75],
    data: [
      ['2026-06-10', 2.04],
      ['2026-06-11', 25.85],
      ['2026-06-12', 44.36],
      ['2026-06-13', 55.65],
      ['2026-06-14', 63.75],
    ],
  },
  spline: {
    name: 'ROI confirmed',
    yDomain: [0, 750],
    data: [
      ['2026-06-10', 610.78],
      ['2026-06-11', 180.5],
      ['2026-06-12', 161.47],
      ['2026-06-13', 56.33],
      ['2026-06-14', 357.25],
    ],
  },
  line: {
    name: 'Conversions',
    yDomain: [0, 120],
    data: [
      ['2026-06-10', 3],
      ['2026-06-11', 30],
      ['2026-06-12', 36],
      ['2026-06-13', 70],
      ['2026-06-14', 90],
    ],
  },
  bar: {
    name: 'CPA',
    yDomain: [0, 75],
    data: [
      ['2026-06-10', 0.68],
      ['2026-06-11', 0.86],
      ['2026-06-12', 1.23],
      ['2026-06-13', 0.79],
      ['2026-06-14', 0.71],
    ],
  },
} satisfies ChartSeries;
