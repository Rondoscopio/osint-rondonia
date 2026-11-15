import { expect, test } from '@playwright/test';

test('o mapa alterna as fontes das bordas e a projeção após o carregamento do worker', async ({
  page,
}) => {
  await page.route('https://tiles.openfreemap.org/styles/positron', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        version: 8,
        sources: {},
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: { 'background-color': '#e8e8e8' },
          },
        ],
      }),
    }),
  );
  const worker = page.waitForResponse((response) =>
    response.url().includes('maplibre-gl-worker'),
  );
  await page.goto('./');
  expect((await worker).ok()).toBe(true);
  await expect(page.locator('.world-map canvas')).toBeVisible();
  await page.getByRole('combobox', { name: 'Fonte das bordas' }).click();
  await page
    .getByRole('option', { name: /OpenFreeMap|OpenStreetMap/i })
    .click();
  await expect(page.locator('.map-attribution')).toContainText('OpenFreeMap');
  await page.getByRole('combobox', { name: 'Fonte das bordas' }).click();
  await page.getByRole('option', { name: /Natural Earth/i }).click();
  await expect(page.locator('.map-attribution')).toContainText('Natural Earth');
  await page.getByRole('button', { name: 'Ver globo' }).click();
  await expect(page.getByRole('button', { name: 'Ver mapa 2D' })).toBeVisible();
  await expect(page.locator('.world-map canvas')).toBeVisible();
});

for (const viewport of [
  { width: 1920, height: 910 },
  { width: 390, height: 844 },
]) {
  test(`a tela aproveita a largura a ${viewport.width}px mesmo com um mosaico salvo`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(() => {
      localStorage.setItem(
        'osint-rondonia-workspaces-v1',
        JSON.stringify({
          version: 1,
          workspaces: [{ title: 'Workspace antigo' }],
        }),
      );
    });
    await page.goto('./');
    const results = page.getByRole('table', { name: 'Fichas', exact: true });
    const map = page.getByRole('region', { name: 'Mapa de cobertura' });
    const footer = page.getByRole('contentinfo');
    await expect(results).toBeVisible();
    await expect(map).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Criar painel' }),
    ).toHaveCount(0);
    await expect(page.getByRole('tablist', { name: 'Workspaces' })).toHaveCount(
      0,
    );
    await expect(page.getByRole('dialog')).toHaveCount(0);
    const mapBox = (await map.boundingBox())!;
    const footerBox = (await footer.boundingBox())!;
    const mainBox = (await page.getByRole('main').boundingBox())!;
    expect(mainBox.width).toBeGreaterThan(viewport.width * 0.8);
    expect(mapBox.width).toBeGreaterThan(viewport.width * 0.3);
    expect(footerBox.width).toBe(viewport.width);
    expect(footerBox.y).toBeGreaterThanOrEqual(mainBox.y + mainBox.height - 1);
    if (viewport.width > 760) {
      await expect(
        page.getByRole('button', { name: 'Próximo' }),
      ).toBeInViewport();
      expect(footerBox.y + footerBox.height).toBeLessThanOrEqual(
        viewport.height,
      );
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(viewport.width);
  });
}

test('estado e município filtram a mesma tabela e os mesmos contadores', async ({
  page,
}) => {
  await page.goto('./');
  const counters = page.getByLabel('Contadores dos resultados');
  const total = counters
    .getByText('Fichas', { exact: true })
    .locator('..')
    .locator('dd');
  await expect(total).toHaveText(/\d/);
  const complete = await total.innerText();
  const map = page.locator('.world-map[aria-busy="false"] canvas');
  await expect(map).toBeVisible();
  const { width, height } = (await map.boundingBox())!;
  await map.click({ position: { x: width / 2, y: height / 2 } });
  await expect(page).toHaveURL(/uf=11/);
  const state = page.getByRole('combobox', { name: 'Estado', exact: true });
  await expect(state).toContainText('Rondônia');
  await expect(total).not.toHaveText(complete);

  const municipality = page.getByRole('combobox', {
    name: 'Município',
    exact: true,
  });
  await municipality.click();
  await page.getByRole('option', { name: 'Porto Velho', exact: true }).click();
  await expect(page).toHaveURL(/municipio=1100205/);
  await expect(municipality).toContainText('Porto Velho');
  await expect(total).toHaveText(/\d/);
  await expect(
    page.getByRole('heading', {
      name: (await total.innerText()) + ' fichas encontradas',
    }),
  ).toBeVisible();

  await page.reload();
  await expect(municipality).toContainText('Porto Velho');
  await page.getByRole('button', { name: 'Limpar seleção' }).click();
  await expect(total).toHaveText(complete);
});

test('falha do SQLite pode ser recuperada pela tabela', async ({ page }) => {
  await page.route('**/catalog.*.sqlite', (route) => route.abort());
  await page.goto('./');
  const results = page.locator('#resultados');
  await expect(results.getByRole('alert')).toContainText(
    'Não foi possível ler o catálogo.',
  );
  await page.unroute('**/catalog.*.sqlite');
  await results.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(
    results.getByRole('heading', { name: /fichas encontradas/ }),
  ).toBeVisible();
});

test('busca em linha, ficha e temas funcionam sem abrir janelas', async ({
  page,
}) => {
  await page.goto('./');
  await expect(
    page.getByRole('heading', { name: /fichas encontradas/ }),
  ).toBeVisible();
  await page.keyboard.press('Control+k');
  const search = page.getByRole('searchbox', {
    name: 'Buscar pelo nome ou descrição',
  });
  await expect(search).toBeFocused();
  await search.fill('Rondônia');
  await search.press('Enter');
  await expect(page).toHaveURL(/\?q=Rond/);
  const results = page.getByRole('table', { name: 'Fichas' });
  const first = results.getByRole('link').first();
  const path = await first.getAttribute('href');
  expect(path).toMatch(/\/(fontes|ferramentas)\/[^/]+\/$/);
  await first.click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page).toHaveURL((url) => url.pathname === path);

  await page.goto('./legal/');
  await expect(
    page.getByRole('heading', { name: 'Privacidade da interface' }),
  ).toBeVisible();
  await page.goto('./recortes/pesquisa-de-dominios/');
  await expect(
    page.getByRole('heading', { name: /ferramentas encontradas/ }),
  ).toBeVisible();
  const theme = page.getByRole('button', { name: 'Ativar tema escuro' });
  await theme.click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('rodapé identifica o build e o cabeçalho oferece o SQLite', async ({
  page,
  request,
}) => {
  await page.goto('./');
  await expect(
    page.getByRole('link', { name: 'Commit 0123456' }),
  ).toHaveAttribute('target', '_blank');
  await expect(page.getByRole('link', { name: 'Build #42' })).toHaveAttribute(
    'href',
    'https://github.com/Rondoscopio/osint-rondonia/actions/runs/4242',
  );
  const file = await page
    .getByRole('link', { name: 'Baixar SQLite' })
    .getAttribute('href');
  const response = await request.get(new URL(file!, page.url()).href);
  expect(response.ok()).toBe(true);
  expect((await response.body()).subarray(0, 16).toString()).toBe(
    'SQLite format 3\0',
  );
});
