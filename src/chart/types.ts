export const SERIES_TYPES = ['area', 'bar', 'spline', 'line'] as const;
export type SeriesType = (typeof SERIES_TYPES)[number];
/** ISO date / ISO datetime with timezone, or Unix milliseconds. */
export type Timestamp = string | number;
export type DataPoint = readonly [time: Timestamp, value: number | null];
export interface TimeSeries {
  readonly name: string;
  readonly data: readonly DataPoint[];
  readonly color?: string;
  /** Independent vertical scale. Defaults to a zero-inclusive automatic domain. */
  readonly yDomain?: readonly [min: number, max: number];
  readonly decimals?: number;
}
export type ChartSeries = Readonly<Record<SeriesType, TimeSeries>>;
export interface TimeSeriesChartProps {
  series: ChartSeries;
  hiddenSeries?: readonly SeriesType[];
  height?: number;
  ariaLabel?: string;
  onActiveDateChange?: (timestamp: number | null) => void;
}
