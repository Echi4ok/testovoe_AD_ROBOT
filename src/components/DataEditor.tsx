import { useState } from 'react';
import { validateSeries, type ChartSeries } from '../chart';
import { referenceSeries } from '../data/reference';

export function DataEditor({
  series,
  onApply,
}: {
  series: ChartSeries;
  onApply: (value: ChartSeries) => void;
}) {
  const [draft, setDraft] = useState(() => JSON.stringify(series, null, 2));
  const [error, setError] = useState('');
  function apply() {
    try {
      const value: unknown = JSON.parse(draft);
      validateSeries(value);
      onApply(value);
      setError('');
    } catch (cause) {
      setError(
        cause instanceof SyntaxError
          ? 'Не удалось прочитать JSON. Проверьте запятые, кавычки и скобки.'
          : cause instanceof Error
            ? cause.message
            : 'Проверьте формат данных.',
      );
    }
  }
  return (
    <section className="editor-panel" aria-labelledby="editor-title">
      <div className="editor-intro">
        <div>
          <h2 id="editor-title">Попробуйте свои данные</h2>
          <p>
            Четыре независимых массива. Даты могут различаться,{' '}
            <code>null</code> создаёт разрыв.
          </p>
        </div>
        <span className="file-badge">series.json</span>
      </div>
      <label className="ts-sr-only" htmlFor="series-editor">
        Четыре ряда в формате JSON
      </label>
      <textarea
        id="series-editor"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        spellCheck={false}
        aria-invalid={!!error}
        aria-describedby={error ? 'editor-error' : undefined}
      />
      {error && (
        <p id="editor-error" className="error-message" role="alert">
          {error}
        </p>
      )}
      <div className="editor-actions">
        <button className="button primary" onClick={apply}>
          Применить данные
        </button>
        <button
          className="button subtle"
          onClick={() => {
            setDraft(JSON.stringify(referenceSeries, null, 2));
            setError('');
          }}
        >
          Вставить исходные
        </button>
        <span>График обновится после применения</span>
      </div>
    </section>
  );
}
