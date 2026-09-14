import { useRef, useState, type KeyboardEvent } from 'react';
import { TimeSeriesChart, type ChartSeries, type SeriesType } from './chart';
import { DEFAULT_COLORS, formatDate, normalize } from './chart/model';
import { SERIES_TYPES } from './chart/types';
import { referenceSeries } from './data/reference';
import { DataEditor } from './components/DataEditor';
import { DataTable } from './components/DataTable';
import { Icon } from './components/Icon';

const repository = 'https://github.com/Echi4ok/testovoe_AD_ROBOT';
const snippet = `import { TimeSeriesChart } from './chart';\n\n<TimeSeriesChart series={{\n  area:   { name: 'Cost',          data: cost },\n  spline: { name: 'ROI confirmed', data: roi },\n  line:   { name: 'Conversions',   data: conversions },\n  bar:    { name: 'CPA',           data: cpa },\n}} />`;
const descriptions: Record<SeriesType, string> = {
  area: 'Area',
  bar: 'Bar',
  spline: 'Spline',
  line: 'Line',
};

export default function App() {
  const [series, setSeries] = useState<ChartSeries>(referenceSeries);
  const [hidden, setHidden] = useState<SeriesType[]>([]);
  const [tab, setTab] = useState<'preview' | 'data'>('preview');
  const [showTable, setShowTable] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  const [status, setStatus] = useState('');
  const tabs = useRef<HTMLDivElement>(null);
  const { times } = normalize(series);
  const first = times[0],
    last = times.at(-1);

  function reset() {
    setSeries(referenceSeries);
    setHidden([]);
    setStatus('Исходные данные и все четыре ряда восстановлены.');
  }
  function toggle(type: SeriesType) {
    setHidden((current) =>
      current.includes(type)
        ? current.filter((value) => value !== type)
        : [...current, type],
    );
  }
  function tabKeys(event: KeyboardEvent<HTMLButtonElement>) {
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const next =
        event.key === 'Home'
          ? 'preview'
          : event.key === 'End'
            ? 'data'
            : tab === 'preview'
              ? 'data'
              : 'preview';
      setTab(next);
      tabs.current?.querySelector<HTMLButtonElement>(`#tab-${next}`)?.focus();
    }
  }

  return (
    <>
      <header className="site-header">
        <a className="brand" href="./" aria-label="AD ROBOT — главная">
          <span className="brand-mark">
            <Icon name="chart" />
          </span>
          <span>
            AD<span className="brand-light"> / </span>ROBOT
          </span>
          <span className="header-divider" />
          <span className="header-project">Frontend task</span>
        </a>
        <a
          className="repo-link"
          href={repository}
          target="_blank"
          rel="noreferrer"
        >
          Исходный код
          <Icon name="arrow" />
        </a>
      </header>
      <main>
        <section className="intro">
          <div className="eyebrow">
            <span />
            TIME SERIES COMPONENT
          </div>
          <h1>
            Четыре ряда.
            <br className="mobile-break" /> Один график.
          </h1>
          <p>
            Area, spline, line и bar — с общей подсказкой
            <br className="desktop-break" /> и поведением из референса.
          </p>
        </section>
        <section className="demo-card" aria-label="Демонстрация графика">
          <div className="demo-tabs-row">
            <div
              className="tabs"
              ref={tabs}
              role="tablist"
              aria-label="Режим демонстрации"
            >
              <button
                role="tab"
                id="tab-preview"
                aria-controls="panel-preview"
                aria-selected={tab === 'preview'}
                tabIndex={tab === 'preview' ? 0 : -1}
                onClick={() => setTab('preview')}
                onKeyDown={tabKeys}
              >
                <Icon name="chart" />
                График
              </button>
              <button
                role="tab"
                id="tab-data"
                aria-controls="panel-data"
                aria-selected={tab === 'data'}
                tabIndex={tab === 'data' ? 0 : -1}
                onClick={() => setTab('data')}
                onKeyDown={tabKeys}
              >
                <Icon name="code" />
                Свои данные
              </button>
            </div>
            <span className="live-label">
              <span />
              Интерактивное демо
            </span>
          </div>
          {tab === 'preview' ? (
            <div
              role="tabpanel"
              id="panel-preview"
              aria-labelledby="tab-preview"
            >
              <div className="chart-toolbar">
                <div>
                  <span className="toolbar-title">Обзор показателей</span>
                  <span className="date-range">
                    {first === undefined || last === undefined
                      ? 'Нет дат'
                      : `${formatDate(first)} — ${formatDate(last)}`}
                  </span>
                </div>
                <button
                  className="reset-button"
                  onClick={reset}
                  title="Восстановить исходный график"
                >
                  <Icon name="reset" />
                  <span>Сбросить</span>
                </button>
              </div>
              <div className="chart-stage">
                <div className="chart-mount">
                  <TimeSeriesChart
                    series={series}
                    hiddenSeries={hidden}
                    ariaLabel="Обзор показателей по времени"
                  />
                </div>
              </div>
              <div className="legend" aria-label="Показать или скрыть ряды">
                {SERIES_TYPES.map((type) => (
                  <button
                    key={type}
                    className="legend-item"
                    aria-label={`${series[type].name} ${descriptions[type]}`}
                    aria-pressed={!hidden.includes(type)}
                    onClick={() => toggle(type)}
                  >
                    <span
                      className={`legend-dot legend-dot-${type}`}
                      style={{
                        backgroundColor:
                          series[type].color ?? DEFAULT_COLORS[type],
                      }}
                    />
                    <span>{series[type].name}</span>
                    <span className="legend-type">{descriptions[type]}</span>
                  </button>
                ))}
              </div>
              <div className="chart-footer">
                <span>
                  <span className="desktop-hint">
                    Наведите на график или используйте
                  </span>
                  <span className="mobile-hint">Коснитесь графика · </span>
                  <kbd>←</kbd>
                  <kbd>→</kbd>
                </span>
                <button
                  onClick={() => setShowTable((value) => !value)}
                  aria-expanded={showTable}
                  aria-controls="data-table"
                >
                  <Icon name="table" />
                  {showTable ? 'Скрыть таблицу' : 'Таблица данных'}
                </button>
              </div>
              {showTable && (
                <div id="data-table">
                  <DataTable series={series} />
                </div>
              )}
            </div>
          ) : (
            <div role="tabpanel" id="panel-data" aria-labelledby="tab-data">
              <DataEditor
                series={series}
                onApply={(value) => {
                  setSeries(value);
                  setHidden([]);
                  setTab('preview');
                  setStatus('Данные применены. График обновлён.');
                }}
              />
            </div>
          )}
        </section>
        <div className="details-grid">
          <section className="details-copy">
            <span className="section-index">01 / ИНИЦИАЛИЗАЦИЯ</span>
            <h2>
              Подключите свои
              <br />
              последовательности.
            </h2>
            <p>
              Каждая точка — пара <code>[дата, значение]</code>.<br /> Передайте
              четыре массива в <code>series</code>,
              <br className="desktop-break" /> компонент сделает остальное.
            </p>
            <a
              className="text-link"
              href={`${repository}#инициализация-четырьмя-рядами`}
              target="_blank"
              rel="noreferrer"
            >
              Документация и пример
              <Icon name="arrow" />
            </a>
          </section>
          <section className="code-card" aria-label="Пример инициализации">
            <div className="code-header">
              <span>
                <span className="code-file-dot" />
                Example.tsx
              </span>
              <button
                aria-label={copied ? 'Код скопирован' : 'Скопировать пример'}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(snippet);
                    setCopied(true);
                    setCopyError('');
                  } catch {
                    setCopyError(
                      'Не удалось скопировать. Выделите код вручную.',
                    );
                  }
                }}
              >
                <Icon name={copied ? 'check' : 'copy'} />
                {copied ? 'Скопировано' : 'Копировать'}
              </button>
            </div>
            <pre tabIndex={0} aria-label="Код примера инициализации">
              <code>{snippet}</code>
            </pre>
            {copyError && <p role="status">{copyError}</p>}
          </section>
        </div>
        <div className="implementation-notes">
          <span>React + TypeScript</span>
          <span>SVG · адаптивный размер</span>
          <span>Мышь, touch и клавиатура</span>
        </div>
        <p className="ts-sr-only" role="status">
          {status}
        </p>
      </main>
      <footer className="site-footer">
        <span>Тестовое задание · AD ROBOT</span>
        <a
          href="https://cleanshot.com/share/cBDRxJWM"
          target="_blank"
          rel="noreferrer"
        >
          Посмотреть референс
          <Icon name="arrow" />
        </a>
      </footer>
    </>
  );
}
