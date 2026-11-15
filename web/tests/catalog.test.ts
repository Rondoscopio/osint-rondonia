import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import initSqlJs from 'sql.js';
import { openCatalog } from '../src/lib/features/catalog/adapters/sqlite-catalog.ts';
import {
  PAGE_SIZE,
  type Filters,
} from '../src/lib/features/catalog/domain/types.ts';
import { displayLabel, displayText } from '../src/lib/shared/labels.ts';
import { RECUT_GROUPS, RECUTS } from '../src/lib/shared/recuts.ts';

const sqlite = await initSqlJs();
const file = new URL('../../data/exports/catalog.sqlite', import.meta.url);
const catalog = openCatalog(new sqlite.Database(readFileSync(file)));
const filters: Filters = {
  q: '',
  categoria: '',
  tipo: '',
  natureza: 'fonte',
  triagem: '',
  uf: '',
  municipio: '',
  ordem: 'asc',
  pagina: 1,
};

test('rótulos técnicos são apresentados em português sem alterar os valores do catálogo', () => {
  assert.equal(displayLabel('ferramenta_ou_servico'), 'Ferramenta ou Serviço');
  assert.equal(displayLabel('portal_de_noticias'), 'Portal de Notícias');
  assert.equal(displayLabel('ciencias_sociais'), 'Ciências Sociais');
  assert.equal(displayText('sessoes'), 'Sessões');
  assert.equal(displayText('pendente'), 'Pendente');
  assert.equal(
    displayText('Tipo ferramenta_ou_servico'),
    'Tipo Ferramenta ou Serviço',
  );
  assert.equal(
    displayText('https://exemplo.org/portal_de_noticias'),
    'https://exemplo.org/portal_de_noticias',
  );
  assert.equal(
    displayText('Tipo ferramenta_ou_servico'),
    'Tipo Ferramenta ou Serviço',
  );
  assert.equal(
    displayText('https://exemplo.org/portal_de_noticias'),
    'https://exemplo.org/portal_de_noticias',
  );
  assert.equal(displayLabel('portal editorial'), 'portal editorial');
  assert.equal(
    catalog.options().tipos.find(({ id }) => id === 'typ-badc6877705cb9')?.nome,
    'ferramenta_ou_servico',
  );
});

test('os grupos de recortes têm cinco páginas e apontam para categorias existentes', () => {
  const categoryIds = new Set(catalog.options().categorias.map(({ id }) => id));
  assert.equal(RECUT_GROUPS.length, 11);
  assert.ok(RECUT_GROUPS.slice(0, 5).every(({ items }) => items.length === 5));
  assert.equal(
    RECUT_GROUPS.find((group) => group.id === 'colecoes-tematicas')?.items
      .length,
    19,
  );
  assert.equal(new Set(RECUTS.map(({ slug }) => slug)).size, RECUTS.length);
  for (const recut of RECUTS) {
    assert.ok(recut.title.length > 0);
    assert.ok(recut.description.length > 0);
    assert.ok(recut.categoryIds.length > 0);
    assert.ok(recut.categoryIds.every((id) => categoryIds.has(id)));
  }
  assert.ok(
    RECUTS.filter(({ groupId }) => groupId === 'ferramentas-osint').every(
      ({ natureza }) => natureza === 'ferramenta',
    ),
  );
  assert.ok(
    RECUTS.filter(
      ({ groupId }) =>
        groupId !== 'ferramentas-osint' && groupId !== 'colecoes-tematicas',
    ).every(({ natureza }) => natureza === 'fonte'),
  );
  assert.ok(
    RECUTS.filter(({ groupId }) => groupId === 'colecoes-tematicas').every(
      ({ natureza }) => natureza === 'todos',
    ),
  );
});

test('a distribuição real abre, conta fichas e pagina sem repetição', () => {
  const first = catalog.search(filters);
  const next = catalog.search({ ...filters, pagina: 2 });
  assert.ok(first.total > PAGE_SIZE);
  assert.equal(catalog.dashboard().fontes, first.total);
  assert.deepEqual(first.totals, { fonte: first.total, ferramenta: 0 });
  const everyone = catalog.search({ ...filters, natureza: 'todos' });
  assert.equal(
    everyone.totals.fonte + everyone.totals.ferramenta,
    everyone.total,
  );
  assert.ok(everyone.totals.ferramenta > 0);
  assert.equal(first.items.length, PAGE_SIZE);
  assert.equal(
    new Set([...first.items, ...next.items].map(({ id }) => id)).size,
    2 * PAGE_SIZE,
  );
  assert.equal(catalog.search({ ...filters, q: "x%' OR 1=1 --" }).total, 0);
  assert.deepEqual(
    catalog.search({ ...filters, q: 'RÔNDÔNIA' }),
    catalog.search({ ...filters, q: 'rondonia' }),
  );
});

test('recortes aplicam interseção e exclusão de categorias diretamente', () => {
  const db = new sqlite.Database(readFileSync(file));
  db.run(`
    INSERT INTO fonte (id, nome, natureza) VALUES ('teste-a', 'FONTE TESTE A', 'fonte'), ('teste-b', 'FONTE TESTE B', 'fonte');
    INSERT INTO categoria VALUES ('teste-c1', 'Tema 1', 'principal'), ('teste-c2', 'Tema 2', 'principal');
    INSERT INTO fonte_categoria VALUES ('teste-a','teste-c1'), ('teste-a','teste-c2'), ('teste-b','teste-c1');
  `);
  const fixture = openCatalog(db);
  assert.deepEqual(
    fixture
      .search({
        ...filters,
        categoryFilter: { allOf: ['teste-c1', 'teste-c2'] },
      })
      .items.map(({ id }) => id),
    ['teste-a'],
  );
  assert.deepEqual(
    fixture
      .search({
        ...filters,
        categoryFilter: { anyOf: ['teste-c1'], noneOf: ['teste-c2'] },
      })
      .items.map(({ id }) => id),
    ['teste-b'],
  );
  const graph = fixture.graph('categoria', 'teste-c1');
  assert.equal(graph?.total, 2);
  assert.deepEqual(
    graph?.neighbors.map(({ id }) => id),
    ['teste-a', 'teste-b'],
  );
  assert.equal(fixture.detail('teste-a')?.categorias.length, 2);
});

test('recortes unem categorias por OR sem duplicar fichas e preservam natureza', () => {
  const db = new sqlite.Database(readFileSync(file));
  db.run(`
    INSERT INTO categoria VALUES
      ('teste-recorte-a', 'Tema de recorte A', 'principal'),
      ('teste-recorte-b', 'Tema de recorte B', 'curadoria');
    INSERT INTO fonte (id, nome, natureza, status_triagem) VALUES
      ('teste-recorte-fonte-a', 'Fonte A', 'fonte', 'pendente'),
      ('teste-recorte-fonte-b', 'Fonte B', 'fonte', NULL),
      ('teste-recorte-tool', 'Ferramenta C', 'ferramenta', NULL);
    INSERT INTO fonte_categoria VALUES
      ('teste-recorte-fonte-a', 'teste-recorte-a'),
      ('teste-recorte-fonte-a', 'teste-recorte-b'),
      ('teste-recorte-fonte-b', 'teste-recorte-a'),
      ('teste-recorte-tool', 'teste-recorte-b');
    INSERT INTO abrangencia VALUES ('teste-recorte-cobertura', 0, 0);
    INSERT INTO abrangencia_uf VALUES ('teste-recorte-cobertura', 11);
    INSERT INTO fonte_abrangencia (fonte_id, abrangencia_id, papel)
      VALUES ('teste-recorte-fonte-a', 'teste-recorte-cobertura', 'cobertura');
  `);
  const fixture = openCatalog(db);
  const categoryIds = ['teste-recorte-a', 'teste-recorte-b'];
  const sourceResults = fixture.search({
    ...filters,
    categorias: categoryIds,
    natureza: 'fonte',
  });
  assert.equal(sourceResults.total, 2);
  assert.deepEqual(
    sourceResults.items.map(({ id }) => id),
    ['teste-recorte-fonte-a', 'teste-recorte-fonte-b'],
  );
  assert.equal(fixture.recutSummary({ anyOf: categoryIds }, 'fonte').total, 2);
  assert.equal(
    fixture.recutSummary({ anyOf: categoryIds }, 'ferramenta').total,
    1,
  );
  assert.equal(
    fixture.search({
      ...filters,
      categorias: categoryIds,
      natureza: 'ferramenta',
    }).items[0].id,
    'teste-recorte-tool',
  );
  const map = fixture.coverageMap({ anyOf: categoryIds });
  assert.equal(map.states.find(({ sigla }) => sigla === 'RO')?.total, 1);
  assert.equal(map.states.find(({ sigla }) => sigla === 'AC')?.total, 0);
  assert.equal(map.municipalities.find(({ id }) => id === '1100205')?.total, 1);
});

test('cobertura nacional entra automaticamente nos filtros territoriais', () => {
  const db = new sqlite.Database(readFileSync(file));
  db.run(`
    INSERT INTO fonte (id, nome, natureza) VALUES ('teste-m', 'FONTE TESTE Municipal', 'fonte'), ('teste-n', 'FONTE TESTE Nacional', 'fonte'), ('teste-l', 'FONTE TESTE Localidade', 'fonte');
    INSERT INTO abrangencia VALUES ('teste-a', 0, 0), ('teste-nacional', 1, 0);
    INSERT INTO abrangencia_uf VALUES ('teste-a', 11);
    INSERT INTO abrangencia_municipio VALUES ('teste-a', 1100205);
    INSERT INTO fonte_abrangencia (fonte_id, abrangencia_id, papel) VALUES
      ('teste-m', 'teste-a', 'cobertura'), ('teste-n', 'teste-nacional', 'cobertura'), ('teste-l', 'teste-a', 'localidade_declarada');
  `);
  const fixture = openCatalog(db);
  const territory = { ...filters, q: 'FONTE TESTE', uf: '11' };
  assert.deepEqual(
    fixture.search(territory).items.map(({ id }) => id),
    ['teste-m', 'teste-n'],
  );
  assert.deepEqual(
    fixture
      .search({ ...territory, municipio: '1100205' })
      .items.map(({ id }) => id),
    ['teste-m', 'teste-n'],
  );
});

test('mapa expande UFs e inclui cobertura nacional sem duplicar fichas', () => {
  const bytes = readFileSync(file);
  const baseline = openCatalog(new sqlite.Database(bytes));
  const baselineCoverage = baseline.coverageMap();
  const countFor = (map: ReturnType<typeof baseline.coverageMap>, id: string) =>
    map.municipalities.find((item) => item.id === id)?.total ?? 0;
  const stateCountFor = (
    map: ReturnType<typeof baseline.coverageMap>,
    sigla: string,
  ) => map.states.find((item) => item.sigla === sigla)?.total ?? 0;
  const db = new sqlite.Database(bytes);
  db.run(`
    INSERT INTO fonte (id, nome, natureza) VALUES
      ('mapa-estadual', 'MAPA TESTE estadual', 'fonte'),
      ('mapa-municipal', 'MAPA TESTE municipal', 'fonte'),
      ('mapa-nacional', 'MAPA TESTE nacional', 'fonte');
    INSERT INTO abrangencia VALUES
      ('mapa-uf-municipio', 0, 0),
      ('mapa-so-municipio', 0, 0),
      ('mapa-brasil', 1, 0);
    INSERT INTO abrangencia_uf VALUES ('mapa-uf-municipio', 11);
    INSERT INTO abrangencia_municipio VALUES
      ('mapa-uf-municipio', 1100205),
      ('mapa-so-municipio', 1100205);
    INSERT INTO fonte_abrangencia (fonte_id, abrangencia_id, papel) VALUES
      ('mapa-estadual', 'mapa-uf-municipio', 'cobertura'),
      ('mapa-municipal', 'mapa-so-municipio', 'cobertura'),
      ('mapa-nacional', 'mapa-brasil', 'cobertura');
  `);
  const fixture = openCatalog(db);

  const coverage = fixture.coverageMap();
  const portoVelho = coverage.municipalities.find(({ id }) => id === '1100205');
  const altaFloresta = coverage.municipalities.find(
    ({ id }) => id === '1100015',
  );
  assert.ok(portoVelho && altaFloresta);
  assert.equal(portoVelho.total, countFor(baselineCoverage, '1100205') + 3);
  assert.equal(altaFloresta.total, countFor(baselineCoverage, '1100015') + 2);
  assert.equal(coverage.states.length, 27);
  assert.equal(
    stateCountFor(coverage, 'RO'),
    stateCountFor(baselineCoverage, 'RO') + 3,
  );
  assert.equal(
    stateCountFor(coverage, 'AC'),
    stateCountFor(baselineCoverage, 'AC') + 1,
  );

  assert.equal(coverage.municipalities.length, 5571);

  const municipality = {
    ...filters,
    q: 'MAPA TESTE',
    uf: '11',
    municipio: '1100205',
  };
  assert.deepEqual(
    fixture.search(municipality).items.map(({ id }) => id),
    ['mapa-estadual', 'mapa-municipal', 'mapa-nacional'],
  );
});

test('o SQLite ordena o resultado completo e combina filtros de cabeçalho', () => {
  const db = new sqlite.Database(readFileSync(file));
  db.run(
    "INSERT INTO categoria VALUES ('teste-grade', 'Tema da grade', 'principal')",
  );
  for (let index = 1; index <= PAGE_SIZE + 3; index++) {
    const id = 'teste-grade-' + String(index).padStart(2, '0');
    db.run(
      'INSERT INTO fonte (id, nome, natureza, descricao, status_triagem) VALUES (?, ?, ?, ?, ?)',
      [
        id,
        'Fonte de teste ' + id,
        'fonte',
        index >= PAGE_SIZE + 2 ? 'Água' : 'Zoologia',
        index === 1 ? '' : null,
      ],
    );
    db.run('INSERT INTO fonte_categoria VALUES (?, ?)', [id, 'teste-grade']);
  }
  const fixture = openCatalog(db);
  const query = { ...filters, categoria: 'teste-grade' };
  const original = fixture.search(query);
  const sorted = fixture.search({
    ...query,
    tableSort: { id: 'descricao', desc: false },
  });
  assert.equal(sorted.total, PAGE_SIZE + 3);
  assert.equal(sorted.items[0].id, 'teste-grade-27');
  assert.equal(sorted.items[1].id, 'teste-grade-28');
  assert.ok(!original.items.some(({ id }) => id === sorted.items[0].id));
  const secondPage = fixture.search({
    ...query,
    tableSort: { id: 'descricao', desc: false },
    pagina: 2,
  });
  assert.equal(
    new Set([...sorted.items, ...secondPage.items].map(({ id }) => id)).size,
    sorted.total,
  );
  assert.equal(
    fixture.search({
      ...query,
      tableFilters: { descricao: 'AGUA', triagem: 'sem-registro' },
    }).total,
    2,
  );
  assert.equal(
    fixture.search({
      ...query,
      tableFilters: { descricao: 'AGUA', triagem: '__valor_vazio__' },
    }).total,
    0,
  );
  assert.equal(
    fixture.search({
      ...query,
      tableFilters: { descricao: 'ZOO', triagem: '__valor_vazio__' },
    }).total,
    1,
  );
  assert.deepEqual(
    fixture.search({ ...query, tableSort: { id: '__proto__', desc: true } }),
    original,
  );
  db.close();
});

test('a fila de curadoria ordena contagens como números e filtra por igualdade', () => {
  const db = new sqlite.Database(readFileSync(file));
  for (let index = 0; index <= PAGE_SIZE; index++) {
    db.run(
      'INSERT INTO fonte (id, nome, natureza, status_triagem) VALUES (?, ?, ?, ?)',
      [
        'teste-fila-' + index,
        'Nome único de teste ' + index,
        'fonte',
        index === 0 ? '' : null,
      ],
    );
  }
  for (let index = 0; index < 10; index++) {
    const category = 'teste-fila-cat-' + index;
    db.run('INSERT INTO categoria VALUES (?, ?, ?)', [
      category,
      category,
      'principal',
    ]);
    db.run('INSERT INTO fonte_categoria VALUES (?, ?)', [
      'teste-fila-25',
      category,
    ]);
    if (index < 2)
      db.run('INSERT INTO fonte_categoria VALUES (?, ?)', [
        'teste-fila-0',
        category,
      ]);
  }
  const fixture = openCatalog(db);
  const query = {
    triagem: '',
    validacao: '',
    natureza: 'fonte' as const,
    pagina: 1,
    tableFilters: { nome: 'NOME UNICO DE TESTE' },
    tableSort: { id: 'categorias', desc: true },
  };
  const sorted = fixture.curationRecords(query);
  assert.equal(sorted.total, PAGE_SIZE + 1);
  assert.deepEqual(
    sorted.itens.slice(0, 2).map(({ categorias }) => categorias),
    [10, 2],
  );
  assert.equal(
    fixture.curationRecords({ ...query, pagina: 2 }).itens.length,
    1,
  );
  assert.equal(
    fixture.curationRecords({
      ...query,
      tableFilters: {
        ...query.tableFilters,
        categorias: '2',
        triagem: '__valor_vazio__',
      },
    }).itens[0].id,
    'teste-fila-0',
  );
  assert.equal(
    fixture.curationRecords({
      ...query,
      tableFilters: {
        ...query.tableFilters,
        categorias: '2',
        triagem: '__sem_registro__',
      },
    }).total,
    0,
  );
  db.close();
});
