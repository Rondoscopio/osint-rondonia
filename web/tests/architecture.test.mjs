import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';
import { ESLint } from 'eslint';

const here = path.dirname(fileURLToPath(import.meta.url));
const eslint = new ESLint({ cwd: path.resolve(here, '..') });

async function lint(fixture, filePath) {
  const source = await readFile(
    path.join(here, '../lint/fixtures/architecture', fixture),
    'utf8',
  );
  const [result] = await eslint.lintText(source, { filePath });
  return result.messages;
}

test('proíbe elementos nativos dentro de condicionais e snippets', async () => {
  for (const fixture of [
    'native-conditional.fixture',
    'native-snippet.fixture',
  ]) {
    const messages = await lint(
      fixture,
      'src/lib/views/architecture-fixture.svelte',
    );
    assert.ok(
      messages.some(({ ruleId }) => ruleId === 'no-restricted-syntax'),
      fixture,
    );
  }
});

test('proíbe SVG, tags Svelte dinâmicas, head, estilos locais e HTML bruto fora de components', async () => {
  const structural = await lint(
    'native-svg-dynamic-head-style.fixture',
    'src/lib/views/architecture-fixture.svelte',
  );
  assert.ok(
    structural.filter(({ ruleId }) => ruleId === 'no-restricted-syntax')
      .length >= 4,
  );
  const raw = await lint(
    'raw-html.fixture',
    'src/lib/views/architecture-fixture.svelte',
  );
  assert.ok(raw.some(({ ruleId }) => ruleId === 'svelte/no-at-html-tags'));
});

test('bloqueia adapters por alias e caminho relativo', async () => {
  const alias = await lint(
    'forbidden-alias.fixture',
    'src/lib/views/architecture-fixture.ts',
  );
  const relative = await lint(
    'forbidden-relative.fixture',
    'src/lib/views/architecture-fixture.ts',
  );
  for (const messages of [alias, relative])
    assert.ok(messages.some(({ ruleId }) => ruleId === 'layers/dependencies'));
});

test('exige caminhos literais para importações internas', async () => {
  const messages = await lint(
    'dynamic-import.fixture',
    'src/lib/views/architecture-fixture.ts',
  );
  assert.ok(messages.some(({ ruleId }) => ruleId === 'layers/dependencies'));
});

test('aceita componentes, composição por props e referências estáticas de Worker', async () => {
  const component = await lint(
    'valid-component.fixture',
    'src/lib/components/ui/architecture-fixture.svelte',
  );
  const view = await lint(
    'valid-view.fixture',
    'src/lib/views/architecture-fixture.svelte',
  );
  const worker = await lint(
    'valid-worker.fixture',
    'src/lib/features/catalog/adapters/architecture-fixture.ts',
  );
  assert.deepEqual(component, []);
  assert.deepEqual(view, []);
  assert.deepEqual(worker, []);
});
