import type { ChartSeries } from '../chart';
import { formatDate, formatValue, normalize } from '../chart/model';

export function DataTable({ series }: { series: ChartSeries }) {
  const { rows, times } = normalize(series);
  return (
    <div
      className="data-table-wrap"
      tabIndex={0}
      role="region"
      aria-label="Таблица исходных значений"
    >
      <table>
        <caption className="ts-sr-only">
          Все исходные значения, включая скрытые ряды. Время в UTC.
        </caption>
        <thead>
          <tr>
            <th scope="col">Дата · UTC</th>
            {rows.map((row) => (
              <th scope="col" key={row.type}>
                {row.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {times.map((time) => (
            <tr key={time}>
              <th scope="row">
                {formatDate(time)}
                {new Date(time).toISOString().slice(11, 23) !==
                  '00:00:00.000' && (
                  <span className="table-time">
                    {new Date(time).toISOString().slice(11, 23)}
                  </span>
                )}
              </th>
              {rows.map((row) => (
                <td key={row.type}>
                  {formatValue(row.values.get(time), row.decimals)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!times.length && (
        <p className="table-empty">В массивах пока нет точек.</p>
      )}
    </div>
  );
}
