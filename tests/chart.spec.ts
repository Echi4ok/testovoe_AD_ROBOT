import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { referenceSeries } from '../src/data/reference';

const chart = (page: Page) =>
  page.getByRole('group', { name: 'Обзор показателей по времени' });
async function apply(page: Page, value: unknown) {
  await page.getByRole('tab', { name: 'Свои данные' }).click();
  await page
    .getByLabel('Четыре ряда в формате JSON')
    .fill(JSON.stringify(value));
  await page.getByRole('button', { name: 'Применить данные' }).click();
}
test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('all five shared tooltips reproduce the reference values', async ({
  page,
}) => {
  await chart(page).focus();
  await chart(page).press('Home');
  for (let index = 0; index < 5; index++) {
    const tooltip = page.getByRole('tooltip');
    await expect(tooltip).toContainText(`${10 + index}.06.2026`);
    for (const type of ['area', 'bar', 'spline', 'line'] as const) {
      const row = referenceSeries[type];
      await expect(tooltip).toContainText(
        `${row.name}: ${row.data[index]![1].toFixed(type === 'line' ? 0 : 2)}`,
      );
    }
    await chart(page).press('ArrowRight');
  }
  await chart(page).press('Escape');
  await expect(page.getByRole('tooltip')).toHaveCount(0);
});

test('pointer uses nearest timestamp, shows halos and clears on leave', async ({
  page,
}) => {
  await chart(page).scrollIntoViewIfNeeded();
  const box = (await chart(page).boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + 230);
  await expect(page.getByRole('tooltip')).toContainText('12.06.2026');
  await expect(page.locator('[data-active-series]')).toHaveCount(3);
  await page.mouse.move(0, 0);
  await expect(page.getByRole('tooltip')).toHaveCount(0);
});

test('legend toggles rendering, tooltip membership and all-hidden state', async ({
  page,
}) => {
  const legend = page.getByRole('button', { name: 'Cost Area', exact: true });
  await legend.click();
  await expect(legend).toHaveAttribute('aria-pressed', 'false');
  await chart(page).focus();
  await chart(page).press('Home');
  await expect(page.getByRole('tooltip')).not.toContainText('Cost:');
  await expect(page.locator('.ts-area')).toHaveCount(0);
  for (const name of ['CPA Bar', 'ROI confirmed Spline', 'Conversions Line'])
    await page.getByRole('button', { name, exact: true }).click();
  await expect(page.getByText('Все ряды скрыты')).toBeVisible();
  await page.getByRole('button', { name: 'Сбросить', exact: true }).click();
  await expect(page.locator('.ts-area')).toHaveCount(1);
});

test('invalid JSON does not replace a working chart', async ({ page }) => {
  await page.getByRole('tab', { name: 'Свои данные' }).click();
  await page.getByLabel('Четыре ряда в формате JSON').fill('{"area":');
  await page.getByRole('button', { name: 'Применить данные' }).click();
  await expect(page.getByRole('alert')).toContainText(
    'Не удалось прочитать JSON',
  );
  await page.getByRole('tab', { name: 'График', exact: true }).click();
  await chart(page).focus();
  await chart(page).press('End');
  await expect(page.getByRole('tooltip')).toContainText('Conversions: 90');
});

test('different timestamps, nulls and negative data can be applied', async ({
  page,
}) => {
  await apply(page, {
    area: {
      name: 'Area custom',
      data: [
        ['2026-07-01', -5],
        ['2026-07-02', null],
        ['2026-07-04', 15],
      ],
    },
    bar: { name: 'Bar custom', data: [['2026-07-02', -2]] },
    spline: {
      name: 'Spline custom',
      data: [
        ['2026-07-01', 0],
        ['2026-07-03', 0],
      ],
    },
    line: { name: 'Line custom', data: [] },
  });
  await chart(page).focus();
  await chart(page).press('Home');
  await chart(page).press('ArrowRight');
  await expect(page.getByRole('tooltip')).toContainText('02.07.2026');
  await expect(page.getByRole('tooltip')).toContainText('Area custom: —');
  await expect(page.getByRole('tooltip')).toContainText('Bar custom: -2.00');
  const paths = await page
    .locator('.ts-svg path')
    .evaluateAll((items) => items.map((item) => item.getAttribute('d')));
  expect(paths.join(' ')).not.toMatch(/NaN|Infinity/);
});

test('empty input is explicit and the original can be restored', async ({
  page,
}) => {
  await apply(
    page,
    Object.fromEntries(
      Object.entries(referenceSeries).map(([key, value]) => [
        key,
        { ...value, data: [] },
      ]),
    ),
  );
  await expect(page.getByText('Пока нет данных')).toBeVisible();
  await chart(page).focus();
  await chart(page).press('ArrowRight');
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await page.getByRole('button', { name: 'Сбросить', exact: true }).click();
  await expect(page.getByText('Пока нет данных')).toHaveCount(0);
});

test('table exposes original values and all dates', async ({ page }) => {
  await page.getByRole('button', { name: 'Таблица данных' }).click();
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(6);
  await expect(page.getByRole('table')).toContainText('180.50');
  await expect(page.getByRole('table')).toContainText('14.06.2026');
});

test('tooltip stays within the chart at both horizontal edges', async ({
  page,
}) => {
  await chart(page).focus();
  for (const key of ['Home', 'End']) {
    await chart(page).press(key);
    const box = (await chart(page).boundingBox())!;
    const tooltip = (await page.getByRole('tooltip').boundingBox())!;
    expect(tooltip.x).toBeGreaterThanOrEqual(box.x);
    expect(tooltip.x + tooltip.width).toBeLessThanOrEqual(
      box.x + box.width + 1,
    );
    expect(tooltip.y).toBeGreaterThanOrEqual(box.y);
    expect(tooltip.y + tooltip.height).toBeLessThanOrEqual(
      box.y + box.height + 1,
    );
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test('touch opens the shared tooltip', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Touch-specific check');
  await chart(page).scrollIntoViewIfNeeded();
  const box = (await chart(page).boundingBox())!;
  await page.touchscreen.tap(box.x + box.width * 0.5, box.y + 150);
  await expect(page.getByRole('tooltip')).toContainText('12.06.2026');
});

test('accessible preview and editor have no serious or critical axe violations', async ({
  page,
}) => {
  for (const tab of ['График', 'Свои данные']) {
    await page.getByRole('tab', { name: tab, exact: true }).click();
    const audit = await new AxeBuilder({ page }).analyze();
    expect(
      audit.violations.filter((issue) =>
        ['critical', 'serious'].includes(issue.impact ?? ''),
      ),
    ).toEqual([]);
  }
});

test('no browser errors during core interactions', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.reload();
  await chart(page).focus();
  await chart(page).press('End');
  await page.getByRole('tab', { name: 'Свои данные' }).click();
  await page.getByRole('button', { name: 'Применить данные' }).click();
  expect(errors).toEqual([]);
});
