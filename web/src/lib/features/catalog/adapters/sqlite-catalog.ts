import type { Database } from 'sql.js';
import {
  GRAPH_LIMIT,
  PAGE_SIZE,
  type Category,
  type CategoryFilterExpression,
  type Count,
  type CatalogOverview,
  type CatalogSatelliteLayer,
  type CurationFilters,
  type CurationRecord,
  type CurationSummary,
  type CoverageMap,
  type Dashboard,
  type DeclarationField,
  type DeclarationFilters,
  type DeclarationOverview,
  type Detail,
  type Filters,
  type Graph,
  type GraphNode,
  type Item,
  type Municipality,
  type MunicipalityCoverage,
  type Neighbor,
  type NodeKind,
  type Options,
  type PagedRecords,
  type Portal,
  type PortalDetail,
  type RecutAudience,
  type ProvenanceOrigin,
  type ProvenanceOriginDetail,
  type ProvenanceOverview,
  type ProvenanceSource,
  type RecutNature,
  type RecutSummary,
  type SearchResult,
  type Source,
  type StateCoverage,
} from '../domain/types.ts';
import type { SqlValue } from 'sql.js';
import { displayText } from '../../../shared/labels.ts';
import { fold } from '../../../shared/text.ts';

type TableField = { sql: string; numeric?: boolean; filter?: boolean };

function territoryLabelSql(papel: 'cobertura' | 'localidade_declarada') {
  return `(SELECT group_concat(item, ', ') FROM (
    SELECT item, nivel, chave FROM (
      SELECT 'Global' item, 0 nivel, '' chave
      WHERE EXISTS (
        SELECT 1 FROM fonte_abrangencia fa JOIN abrangencia a ON a.id = fa.abrangencia_id
        WHERE fa.fonte_id = f.id AND fa.papel = '${papel}' AND a.internacional = 1
      )
      UNION ALL
      SELECT 'País', 1, ''
      WHERE EXISTS (
        SELECT 1 FROM fonte_abrangencia fa JOIN abrangencia a ON a.id = fa.abrangencia_id
        WHERE fa.fonte_id = f.id AND fa.papel = '${papel}' AND a.nacional = 1
      )
      UNION
      SELECT u.nome, 2, label_key(u.nome)
      FROM fonte_abrangencia fa
      JOIN abrangencia_uf au ON au.abrangencia_id = fa.abrangencia_id
      JOIN uf u ON u.codigo_ibge = au.uf_codigo_ibge
      WHERE fa.fonte_id = f.id AND fa.papel = '${papel}'
      UNION
      SELECT m.nome || '/' || u.sigla, 3, label_key(m.nome) || u.sigla
      FROM fonte_abrangencia fa
      JOIN abrangencia_municipio am ON am.abrangencia_id = fa.abrangencia_id
      JOIN municipio m ON m.codigo_ibge = am.municipio_codigo_ibge
      JOIN uf u ON u.codigo_ibge = m.uf_codigo_ibge
      WHERE fa.fonte_id = f.id AND fa.papel = '${papel}'
    )
    ORDER BY nivel, chave, item
  ))`;
}

const sourceFields = {
  id: { sql: 'f.id' },
  id_externo: { sql: 'f.id_externo' },
  nome: { sql: 'f.nome' },
  descricao: { sql: 'f.descricao' },
  nota: { sql: 'f.nota' },
  observacao: { sql: 'f.observacao' },
  observacoes: { sql: 'f.observacoes' },
  esfera: { sql: 'f.esfera' },
  tecnologia: { sql: 'f.tecnologia' },
  acesso_declarado: { sql: 'f.acesso_declarado' },
  data_referencia: { sql: 'f.data_referencia' },
  referencia_institucional: { sql: 'f.referencia_institucional' },
  repositorio_oficial: { sql: 'f.repositorio_oficial' },
  licenca_spdx: { sql: 'f.licenca_spdx' },
  situacao_url: { sql: 'f.situacao_url' },
  natureza: { sql: 'f.natureza' },
  validacao: { sql: 'sv.valor_original' },
  tipo: { sql: 't.nome', filter: false },
  categoria: {
    sql: `(SELECT group_concat(nome, ' · ') FROM (
      SELECT c.nome FROM fonte_categoria fc JOIN categoria c ON c.id = fc.categoria_id
      WHERE fc.fonte_id = f.id ORDER BY label_key(c.nome), c.tipo_classificacao, c.id
    ))`,
    filter: false,
  },
  portais: {
    sql: `(SELECT group_concat(nome, ' · ') FROM (
      SELECT p.nome FROM fonte_portal fp JOIN portal p ON p.id = fp.portal_id
      WHERE fp.fonte_id = f.id ORDER BY label_key(p.nome), p.id
    ))`,
    filter: true,
  },
  categorias_classificadas: {
    sql: `(SELECT group_concat(item, ' · ') FROM (
      SELECT c.nome || ' (' || c.tipo_classificacao || ')' item
      FROM fonte_categoria fc JOIN categoria c ON c.id = fc.categoria_id
      WHERE fc.fonte_id = f.id
      ORDER BY label_key(c.nome), c.tipo_classificacao, c.id
    ))`,
  },
  portais_papeis: {
    sql: `(SELECT group_concat(item, ' · ') FROM (
      SELECT p.nome || ' (' || fp.papel || ')' item
      FROM fonte_portal fp JOIN portal p ON p.id = fp.portal_id
      WHERE fp.fonte_id = f.id
      ORDER BY label_key(p.nome), fp.papel, p.id
    ))`,
  },
  cobertura: { sql: territoryLabelSql('cobertura') },
  localidade: { sql: territoryLabelSql('localidade_declarada') },
  proveniencia: {
    sql: `(SELECT group_concat(item, ' · ') FROM (
      SELECT fo.tipo_origem || ': ' || o.valor_original ||
             CASE WHEN fr.id IS NULL THEN '' ELSE ' → ' || fr.nome END item
      FROM fonte_origem fo JOIN origem o ON o.id = fo.origem_id
      LEFT JOIN fonte fr ON fr.id = o.fonte_referenciada_id
      WHERE fo.fonte_id = f.id
      ORDER BY fo.tipo_origem, label_key(o.valor_original), o.id
    ))`,
  },
  urls_texto: {
    sql: `(SELECT group_concat(item, ' · ') FROM (
      SELECT CASE WHEN fu.nome IS NULL OR fu.nome = '' THEN fu.url
                  ELSE fu.nome || ': ' || fu.url END item
      FROM fonte_url fu WHERE fu.fonte_id = f.id
      ORDER BY fu.ordem, fu.id
    ))`,
  },
  urls: {
    sql: '(SELECT COUNT(*) FROM fonte_url fu WHERE fu.fonte_id = f.id)',
    numeric: true,
  },
  triagem: { sql: 'f.status_triagem', filter: false },
} satisfies Record<string, TableField>;

function categoryExpressionSql(
  expression: CategoryFilterExpression,
  sourceId: string,
) {
  const clauses: string[] = [];
  const params: SqlValue[] = [];
  const anyOf = [...new Set(expression.anyOf ?? [])];
  const allOf = [...new Set(expression.allOf ?? [])];
  const noneOf = [...new Set(expression.noneOf ?? [])];
  if (anyOf.length) {
    clauses.push(
      `EXISTS (SELECT 1 FROM fonte_categoria fc WHERE fc.fonte_id = ${sourceId} AND fc.categoria_id IN (${anyOf.map(() => '?').join(',')}))`,
    );
    params.push(...anyOf);
  }
  for (const id of allOf) {
    clauses.push(
      `EXISTS (SELECT 1 FROM fonte_categoria fc WHERE fc.fonte_id = ${sourceId} AND fc.categoria_id = ?)`,
    );
    params.push(id);
  }
  if (noneOf.length) {
    clauses.push(
      `NOT EXISTS (SELECT 1 FROM fonte_categoria fc WHERE fc.fonte_id = ${sourceId} AND fc.categoria_id IN (${noneOf.map(() => '?').join(',')}))`,
    );
    params.push(...noneOf);
  }
  return { clauses, params };
}

const curationFields = {
  nome: { sql: 'f.nome' },
  triagem: { sql: 'f.status_triagem', filter: false },
  validacao: { sql: 'sv.valor_original', filter: false },
  disponibilidade: { sql: 'f.situacao_url' },
  categorias: {
    sql: '(SELECT COUNT(*) FROM fonte_categoria fc WHERE fc.fonte_id = f.id)',
    numeric: true,
  },
  urls: {
    sql: '(SELECT COUNT(*) FROM fonte_url fu WHERE fu.fonte_id = f.id)',
    numeric: true,
  },
  origens: {
    sql: '(SELECT COUNT(*) FROM fonte_origem fo WHERE fo.fonte_id = f.id)',
    numeric: true,
  },
} satisfies Record<string, TableField>;

function tableOrder(
  fields: Record<string, TableField>,
  sort: Filters['tableSort'],
  fallback: string,
) {
  const field =
    sort && Object.hasOwn(fields, sort.id) ? fields[sort.id] : undefined;
  if (!field) return fallback + ', f.id';
  const key = field.numeric ? field.sql : `label_key(${field.sql})`;
  return `${field.sql} IS NULL, ${key} ${sort?.desc === true ? 'DESC' : 'ASC'}, f.id`;
}

function selectedValues(value: string | string[] | undefined): string[] {
  if (Array.isArray(value))
    return [...new Set(value.filter((item) => item.trim()))];
  return value?.trim() ? [value] : [];
}

function addSelectionPredicate(
  sql: string,
  values: string[],
  clauses: string[],
  params: SqlValue[],
  missingValue?: string,
  emptyValue?: string,
) {
  if (!values.length) return;
  const conditions: string[] = [];
  if (missingValue && values.includes(missingValue))
    conditions.push(`${sql} IS NULL`);
  if (emptyValue && values.includes(emptyValue)) conditions.push(`${sql} = ''`);
  const includedValues = values.filter(
    (value) => value !== missingValue && value !== emptyValue,
  );
  if (includedValues.length) {
    conditions.push(`${sql} IN (${includedValues.map(() => '?').join(',')})`);
    params.push(...includedValues);
  }
  if (conditions.length) clauses.push(`(${conditions.join(' OR ')})`);
}

function addTablePredicates(
  fields: Record<string, TableField>,
  filters: Filters['tableFilters'],
  clauses: string[],
  params: SqlValue[],
) {
  for (const [id, value] of Object.entries(filters ?? {})) {
    if (!Object.hasOwn(fields, id)) continue;
    const { sql, numeric, filter } = fields[id];
    if (filter === false) continue;
    if (Array.isArray(value)) {
      const values = selectedValues(value);
      if (!values.length) continue;
      clauses.push(`${sql} IN (${values.map(() => '?').join(',')})`);
      params.push(...values);
      continue;
    }
    if (typeof value !== 'string' || !value.trim()) continue;
    if (numeric) {
      const count = Number(value);
      if (!/^\d+$/.test(value) || !Number.isSafeInteger(count)) continue;
      clauses.push(`${sql} = ?`);
      params.push(count);
    } else {
      clauses.push(`instr(label_key(${sql}), ?) > 0`);
      params.push(fold(value.trim().slice(0, 160)));
    }
  }
}

export function openCatalog(db: Database) {
  db.run('PRAGMA query_only = ON');
  db.create_function('fold', (value: string | null) => fold(value ?? ''));
  db.create_function('label_key', (value: string | null) =>
    fold(
      value === null
        ? 'Sem registro'
        : value === ''
          ? 'Valor vazio'
          : displayText(value),
    ),
  );
  const rows = <T>(sql: string, params: SqlValue[] = []): T[] => {
    const statement = db.prepare(sql, params);
    try {
      const result: T[] = [];
      while (statement.step()) result.push(statement.getAsObject() as T);
      return result;
    } finally {
      statement.free();
    }
  };
  const options = (): Options => {
    const categories = rows<Category>(
      `SELECT c.*,
        COUNT(DISTINCT CASE WHEN f.natureza = 'fonte' THEN f.id END) fontes,
        COUNT(DISTINCT CASE WHEN f.natureza = 'ferramenta' THEN f.id END) ferramentas
      FROM categoria c
      LEFT JOIN fonte_categoria fc ON fc.categoria_id = c.id
      LEFT JOIN fonte f ON f.id = fc.fonte_id
      GROUP BY c.id ORDER BY fold(c.nome), c.id`,
    );
    return {
      categorias: categories,
      tipos: rows<Item>(`
        SELECT t.id, t.nome FROM tipo t
        WHERE EXISTS (SELECT 1 FROM fonte f WHERE f.tipo_id = t.id AND f.natureza = 'fonte')
        ORDER BY fold(t.nome), t.id
      `),
      triagens: rows<Item>(
        'SELECT DISTINCT status_triagem id, status_triagem nome FROM fonte WHERE status_triagem IS NOT NULL ORDER BY nome',
      ),
      ufs: rows<Options['ufs'][number]>(`
        WITH cobertura AS (
          SELECT fa.fonte_id, au.uf_codigo_ibge FROM fonte_abrangencia fa
          JOIN abrangencia_uf au USING (abrangencia_id)
          JOIN fonte f ON f.id = fa.fonte_id AND f.natureza = 'fonte'
          WHERE fa.papel = 'cobertura'
          UNION
          SELECT fa.fonte_id, m.uf_codigo_ibge FROM fonte_abrangencia fa
          JOIN abrangencia_municipio am USING (abrangencia_id)
          JOIN municipio m ON m.codigo_ibge = am.municipio_codigo_ibge
          JOIN fonte f ON f.id = fa.fonte_id AND f.natureza = 'fonte'
          WHERE fa.papel = 'cobertura'
        ), nacional AS (
          SELECT DISTINCT fa.fonte_id FROM fonte_abrangencia fa
          JOIN abrangencia a ON a.id = fa.abrangencia_id
          JOIN fonte f ON f.id = fa.fonte_id AND f.natureza = 'fonte'
          WHERE fa.papel = 'cobertura' AND a.nacional = 1
        ), por_uf AS (
          SELECT fonte_id, uf_codigo_ibge FROM cobertura
          UNION
          SELECT n.fonte_id, u.codigo_ibge FROM nacional n CROSS JOIN uf u
        )
        SELECT CAST(u.codigo_ibge AS TEXT) id, u.nome, u.sigla,
          COUNT(DISTINCT por_uf.fonte_id) fontes,
          (SELECT COUNT(*) FROM municipio m WHERE m.uf_codigo_ibge = u.codigo_ibge) municipios
        FROM uf u LEFT JOIN por_uf ON por_uf.uf_codigo_ibge = u.codigo_ibge
        GROUP BY u.codigo_ibge ORDER BY fold(u.nome), u.codigo_ibge
      `),
      municipios: rows<Municipality>(
        'SELECT CAST(m.codigo_ibge AS TEXT) id, m.nome, CAST(m.uf_codigo_ibge AS TEXT) uf FROM municipio m ORDER BY fold(m.nome), m.uf_codigo_ibge',
      ),
    };
  };
  const satelliteLayers = (): CatalogSatelliteLayer[] =>
    rows<CatalogSatelliteLayer>(
      `SELECT cm.id, cm.fonte_id, f.nome fonte_nome, cm.nome, cm.url_tiles,
              cm.periodicidade, cm.data_referencia, cm.atribuicao,
              cm.acknowledgement,
              cm.url_atribuicao, cm.zoom_maximo, cm.tile_size,
              cm.cobertura_continua, cm.ordem
       FROM camada_mapa cm JOIN fonte f ON f.id = cm.fonte_id
       WHERE f.natureza = 'fonte'
       ORDER BY cm.ordem, cm.id`,
    );
  const dashboard = (): Dashboard => {
    const totals = rows<
      Pick<Dashboard, 'fontes' | 'ferramentas' | 'categorias' | 'portais'>
    >(`
      SELECT
             (SELECT COUNT(*) FROM fonte f WHERE f.natureza = 'fonte') fontes,
             (SELECT COUNT(*) FROM fonte f WHERE f.natureza = 'ferramenta') ferramentas,
             (SELECT COUNT(*) FROM categoria) categorias,
             (SELECT COUNT(*) FROM portal) portais
    `)[0];
    return {
      ...totals,
      porCategoria: rows<Count>(`
        SELECT c.id, c.nome, COUNT(DISTINCT fc.fonte_id) total FROM categoria c
        JOIN fonte_categoria fc ON fc.categoria_id = c.id
        JOIN fonte f ON f.id = fc.fonte_id
        WHERE f.natureza = 'fonte'
        GROUP BY c.id
        ORDER BY total DESC, fold(c.nome), c.id LIMIT 8
      `),
      porTipo: rows<Count>(`
        SELECT t.id, t.nome, COUNT(DISTINCT f.id) total FROM tipo t
        JOIN fonte f ON f.tipo_id = t.id
        WHERE f.natureza = 'fonte'
        GROUP BY t.id
        ORDER BY total DESC, fold(t.nome), t.id LIMIT 8
      `),
      porUf: rows<Count>(`
        WITH cobertura AS (
          SELECT fa.fonte_id, au.uf_codigo_ibge FROM fonte_abrangencia fa
          JOIN abrangencia_uf au USING (abrangencia_id) WHERE fa.papel = 'cobertura'
            AND fa.fonte_id IN (SELECT id FROM fonte WHERE natureza = 'fonte')
          UNION
          SELECT fa.fonte_id, m.uf_codigo_ibge FROM fonte_abrangencia fa
          JOIN abrangencia_municipio am USING (abrangencia_id)
          JOIN municipio m ON m.codigo_ibge = am.municipio_codigo_ibge WHERE fa.papel = 'cobertura'
            AND fa.fonte_id IN (SELECT id FROM fonte WHERE natureza = 'fonte')
        ), nacional AS (
          SELECT DISTINCT fa.fonte_id FROM fonte_abrangencia fa
          JOIN abrangencia a ON a.id = fa.abrangencia_id
          JOIN fonte f ON f.id = fa.fonte_id AND f.natureza = 'fonte'
          WHERE fa.papel = 'cobertura' AND a.nacional = 1
        ), por_uf AS (
          SELECT fonte_id, uf_codigo_ibge FROM cobertura
          UNION
          SELECT n.fonte_id, u.codigo_ibge FROM nacional n CROSS JOIN uf u
        )
        SELECT CAST(u.codigo_ibge AS TEXT) id, u.nome, COUNT(DISTINCT p.fonte_id) total
        FROM por_uf p JOIN uf u ON u.codigo_ibge = p.uf_codigo_ibge
        GROUP BY u.codigo_ibge ORDER BY total DESC, fold(u.nome) LIMIT 8
      `),
    };
  };
  const catalogOverview = (): CatalogOverview => {
    const totals = rows<CatalogOverview['totals']>(`
      SELECT
        (SELECT COUNT(*) FROM fonte) registros,
        (SELECT COUNT(*) FROM fonte WHERE natureza = 'fonte') fontes,
        (SELECT COUNT(*) FROM fonte WHERE natureza = 'ferramenta') ferramentas,
        (SELECT COUNT(*) FROM categoria) categorias,
        (SELECT COUNT(*) FROM portal) portais,
        (SELECT COUNT(*) FROM fonte_url) urls,
        (SELECT COUNT(*) FROM origem) origens,
        (SELECT COUNT(*) FROM fonte_categoria) relacoesCategoria,
        (SELECT COUNT(*) FROM fonte_origem) relacoesOrigem,
        (SELECT COUNT(*) FROM abrangencia) conjuntosAbrangencia,
        (SELECT COUNT(DISTINCT fa.fonte_id) FROM fonte_abrangencia fa
         JOIN fonte f ON f.id = fa.fonte_id
         WHERE fa.papel = 'cobertura' AND f.natureza = 'fonte') fontesComCobertura,
        (SELECT COUNT(*) FROM municipio) municipios,
        (SELECT COUNT(*) FROM uf) ufs
    `)[0];
    return {
      totals,
      porNatureza: rows<Count>(`
        SELECT natureza id, natureza nome, COUNT(*) total FROM fonte
        GROUP BY natureza ORDER BY total DESC, fold(natureza)
      `),
      porClassificacao: rows<Count>(`
        SELECT tipo_classificacao id, tipo_classificacao nome, COUNT(*) total
        FROM categoria GROUP BY tipo_classificacao
        ORDER BY total DESC, fold(tipo_classificacao)
      `),
      porTriagem: rows<Count>(`
        SELECT
          CASE WHEN status_triagem IS NULL THEN '__sem_registro__'
               WHEN status_triagem = '' THEN '__valor_vazio__'
               ELSE status_triagem END id,
          CASE WHEN status_triagem IS NULL THEN 'Sem estado informado'
               WHEN status_triagem = '' THEN 'Valor vazio'
               ELSE status_triagem END nome,
          COUNT(*) total
        FROM fonte GROUP BY id, nome ORDER BY total DESC, fold(nome)
      `),
      porCategoria: rows<Count & { fontes: number; ferramentas: number }>(`
        SELECT c.id, c.nome,
          COUNT(DISTINCT f.id) total,
          COUNT(DISTINCT CASE WHEN f.natureza = 'fonte' THEN f.id END) fontes,
          COUNT(DISTINCT CASE WHEN f.natureza = 'ferramenta' THEN f.id END) ferramentas
        FROM categoria c
        LEFT JOIN fonte_categoria fc ON fc.categoria_id = c.id
        LEFT JOIN fonte f ON f.id = fc.fonte_id
        GROUP BY c.id ORDER BY total DESC, fold(c.nome), c.id LIMIT 15
      `),
    };
  };

  const portals = (): Portal[] =>
    rows<Portal>(`
      SELECT p.id, p.nome, p.tipo, p.url_base, p.portal_pai_id,
             parent.nome portal_pai_nome,
             COUNT(DISTINCT fp.fonte_id) fontes,
             COUNT(DISTINCT child.id) filhos
      FROM portal p
      LEFT JOIN portal parent ON parent.id = p.portal_pai_id
      LEFT JOIN fonte_portal fp ON fp.portal_id = p.id
      LEFT JOIN portal child ON child.portal_pai_id = p.id
      GROUP BY p.id
      ORDER BY fold(p.nome), p.tipo, p.id
    `);

  const portal = (id: string, requestedPage = 1): PortalDetail | null => {
    const item = rows<Portal>(
      `
      SELECT p.id, p.nome, p.tipo, p.url_base, p.portal_pai_id,
             parent.nome portal_pai_nome,
             (SELECT COUNT(DISTINCT fp.fonte_id) FROM fonte_portal fp WHERE fp.portal_id = p.id) fontes,
             (SELECT COUNT(*) FROM portal child WHERE child.portal_pai_id = p.id) filhos
      FROM portal p LEFT JOIN portal parent ON parent.id = p.portal_pai_id
      WHERE p.id = ?
    `,
      [id],
    )[0];
    if (!item) return null;

    const pais = rows<Item>(
      `
      WITH RECURSIVE lineage(id, nome, parent_id, depth) AS (
        SELECT p.id, p.nome, p.portal_pai_id, 0 FROM portal p WHERE p.id = ?
        UNION ALL
        SELECT p.id, p.nome, p.portal_pai_id, lineage.depth + 1
        FROM portal p JOIN lineage ON p.id = lineage.parent_id
      )
      SELECT id, nome FROM lineage WHERE id <> ? ORDER BY depth DESC
    `,
      [id, id],
    );
    const children = portals().filter((child) => child.portal_pai_id === id);
    const total = item.fontes;
    const page = Math.min(
      Math.max(1, requestedPage),
      Math.max(1, Math.ceil(total / PAGE_SIZE)),
    );
    const fontes = rows<Source & { papeis_registrados: string | null }>(
      `
      SELECT f.id, f.nome, f.descricao, f.status_triagem, f.natureza, t.nome tipo,
             group_concat(DISTINCT fp.papel) papeis_registrados,
             (SELECT group_concat(nome, ' · ') FROM (
                SELECT c.nome FROM fonte_categoria fc
                JOIN categoria c ON c.id = fc.categoria_id
                WHERE fc.fonte_id = f.id ORDER BY fold(c.nome), c.id
             )) categorias_texto,
             (SELECT group_concat(nome, ' · ') FROM (
                SELECT p.nome FROM fonte_portal fp2
                JOIN portal p ON p.id = fp2.portal_id
                WHERE fp2.fonte_id = f.id ORDER BY fold(p.nome), p.id
             )) portais_texto,
             (SELECT COUNT(*) FROM fonte_url fu WHERE fu.fonte_id = f.id) urls
      FROM fonte_portal fp JOIN fonte f ON f.id = fp.fonte_id
      LEFT JOIN tipo t ON t.id = f.tipo_id
      WHERE fp.portal_id = ?
      GROUP BY f.id
      ORDER BY fold(f.nome), f.id
      LIMIT ? OFFSET ?
    `,
      [id, PAGE_SIZE, (page - 1) * PAGE_SIZE],
    );

    return {
      portal: item,
      pais,
      filhos: children,
      fontes: {
        total,
        pagina: page,
        tamanho: PAGE_SIZE,
        itens: fontes.map(({ papeis_registrados, ...source }) => ({
          ...source,
          papeis: papeis_registrados ? papeis_registrados.split(',') : [],
        })),
      },
    };
  };

  const curationSummary = (): CurationSummary => {
    const total = rows<{ total: number }>('SELECT COUNT(*) total FROM fonte')[0]
      .total;
    const porTriagem = rows<Count>(`
      SELECT
        CASE WHEN status_triagem IS NULL THEN '__sem_registro__'
             WHEN status_triagem = '' THEN '__valor_vazio__'
             ELSE status_triagem END id,
        CASE WHEN status_triagem IS NULL THEN 'Sem estado informado'
             WHEN status_triagem = '' THEN 'Valor vazio'
             ELSE status_triagem END nome,
        COUNT(*) total
      FROM fonte GROUP BY id, nome ORDER BY total DESC, fold(nome)
    `);
    const porValidacao = rows<Count>(`
      SELECT
        CASE WHEN f.status_validacao_id IS NULL THEN '__sem_registro__'
             WHEN sv.valor_original = '' THEN '__valor_vazio__'
             ELSE f.status_validacao_id END id,
        CASE WHEN f.status_validacao_id IS NULL THEN 'Sem estado informado'
             WHEN sv.valor_original = '' THEN 'Valor vazio'
             ELSE sv.valor_original END nome,
        COUNT(*) total
      FROM fonte f LEFT JOIN status_validacao sv ON sv.id = f.status_validacao_id
      GROUP BY id, nome ORDER BY total DESC, fold(nome)
    `);
    const stringCompleteness = (id: string, nome: string, column: string) => {
      const result = rows<{
        informadas: number;
        vazias: number;
        semRegistro: number;
      }>(`
        SELECT
          SUM(CASE WHEN ${column} IS NOT NULL AND ${column} <> '' THEN 1 ELSE 0 END) informadas,
          SUM(CASE WHEN ${column} = '' THEN 1 ELSE 0 END) vazias,
          SUM(CASE WHEN ${column} IS NULL THEN 1 ELSE 0 END) semRegistro
        FROM fonte
      `)[0];
      return { id, nome, ...result };
    };
    const relationCompleteness = (
      id: string,
      nome: string,
      existsSql: string,
    ) => {
      const informadas = rows<{ total: number }>(
        `SELECT COUNT(*) total FROM fonte f WHERE ${existsSql}`,
      )[0].total;
      return {
        id,
        nome,
        informadas,
        vazias: 0,
        semRegistro: total - informadas,
      };
    };
    return {
      total,
      porTriagem,
      porValidacao,
      completude: [
        stringCompleteness('descricao', 'Descrição', 'descricao'),
        relationCompleteness('tipo', 'Tipo', 'f.tipo_id IS NOT NULL'),
        relationCompleteness(
          'categoria',
          'Categoria',
          'EXISTS (SELECT 1 FROM fonte_categoria fc WHERE fc.fonte_id = f.id)',
        ),
        relationCompleteness(
          'url',
          'URL registrada',
          'EXISTS (SELECT 1 FROM fonte_url fu WHERE fu.fonte_id = f.id)',
        ),
        relationCompleteness(
          'origem',
          'Proveniência',
          'EXISTS (SELECT 1 FROM fonte_origem fo WHERE fo.fonte_id = f.id)',
        ),
        stringCompleteness('triagem', 'Triagem editorial', 'status_triagem'),
        stringCompleteness(
          'situacao_url',
          'Disponibilidade técnica declarada',
          'situacao_url',
        ),
        relationCompleteness(
          'validacao',
          'Validação registrada',
          'f.status_validacao_id IS NOT NULL',
        ),
        stringCompleteness('acesso', 'Acesso declarado', 'acesso_declarado'),
        stringCompleteness('licenca', 'Licença declarada', 'licenca_spdx'),
      ],
    };
  };

  const curationRecords = (
    filters: CurationFilters,
  ): PagedRecords<CurationRecord> => {
    const clauses: string[] = [];
    const params: SqlValue[] = [];
    const add = (sql: string, value: SqlValue) => {
      clauses.push(sql);
      params.push(value);
    };
    const naturezas = filters.naturezas?.length
      ? filters.naturezas
      : filters.natureza
        ? [filters.natureza]
        : [];
    addSelectionPredicate('f.natureza', naturezas, clauses, params);
    const triagem = selectedValues(
      filters.tableFilters?.triagem ?? filters.triagem,
    );
    const validacao = selectedValues(
      filters.tableFilters?.validacao ?? filters.validacao,
    );
    addSelectionPredicate(
      'f.status_triagem',
      triagem,
      clauses,
      params,
      '__sem_registro__',
      '__valor_vazio__',
    );
    const validacaoConditions: string[] = [];
    if (validacao.includes('__sem_registro__'))
      validacaoConditions.push('f.status_validacao_id IS NULL');
    if (validacao.includes('__valor_vazio__'))
      validacaoConditions.push("sv.valor_original = ''");
    const validacaoIds = validacao.filter(
      (value) => value !== '__sem_registro__' && value !== '__valor_vazio__',
    );
    if (validacaoIds.length) {
      validacaoConditions.push(
        `f.status_validacao_id IN (${validacaoIds.map(() => '?').join(',')})`,
      );
      params.push(...validacaoIds);
    }
    if (validacaoConditions.length)
      clauses.push(`(${validacaoConditions.join(' OR ')})`);
    addTablePredicates(curationFields, filters.tableFilters, clauses, params);
    const order = tableOrder(
      curationFields,
      filters.tableSort,
      "CASE WHEN f.status_triagem = 'pendente' THEN 0 ELSE 1 END, fold(f.nome)",
    );
    const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';
    const total = rows<{ total: number }>(
      `SELECT COUNT(*) total FROM fonte f
       LEFT JOIN status_validacao sv ON sv.id = f.status_validacao_id ${where}`,
      params,
    )[0].total;
    const pagina = Math.min(
      Math.max(1, filters.pagina),
      Math.max(1, Math.ceil(total / PAGE_SIZE)),
    );
    return {
      total,
      pagina,
      tamanho: PAGE_SIZE,
      itens: rows<CurationRecord>(
        `SELECT f.id, f.nome, f.natureza, f.descricao, t.nome tipo,
                f.status_triagem, sv.valor_original status_validacao,
                f.situacao_url,
                ${curationFields.categorias.sql} categorias,
                ${curationFields.urls.sql} urls,
                ${curationFields.origens.sql} origens
         FROM fonte f
         LEFT JOIN tipo t ON t.id = f.tipo_id
         LEFT JOIN status_validacao sv ON sv.id = f.status_validacao_id
         ${where}
         ORDER BY ${order}
         LIMIT ? OFFSET ?`,
        [...params, PAGE_SIZE, (pagina - 1) * PAGE_SIZE],
      ),
    };
  };

  const declarationColumns: Record<
    DeclarationField,
    { nome: string; sql: string; joins: string }
  > = {
    orgao_responsavel: {
      nome: 'Órgão responsável',
      sql: 'p_orgao.nome',
      joins: `LEFT JOIN fonte_portal fp_orgao ON fp_orgao.fonte_id = f.id AND fp_orgao.papel = 'orgao_responsavel'
              LEFT JOIN portal p_orgao ON p_orgao.id = fp_orgao.portal_id`,
    },
    entidade_responsavel: {
      nome: 'Entidade responsável',
      sql: 'p_entidade.nome',
      joins: `LEFT JOIN fonte_portal fp_entidade ON fp_entidade.fonte_id = f.id AND fp_entidade.papel = 'entidade_responsavel'
              LEFT JOIN portal p_entidade ON p_entidade.id = fp_entidade.portal_id`,
    },
    esfera: { nome: 'Esfera', sql: 'f.esfera', joins: '' },
    acesso_declarado: {
      nome: 'Acesso declarado',
      sql: 'f.acesso_declarado',
      joins: '',
    },
    licenca_spdx: {
      nome: 'Licença declarada',
      sql: 'f.licenca_spdx',
      joins: '',
    },
    tecnologia: {
      nome: 'Tecnologia declarada',
      sql: 'f.tecnologia',
      joins: '',
    },
  };
  const valueIdentity = (column: string) =>
    `CASE WHEN ${column} IS NULL THEN '__sem_registro__' WHEN ${column} = '' THEN '__valor_vazio__' ELSE '__texto__:' || hex(CAST(${column} AS BLOB)) END`;
  const valueLabel = (column: string) =>
    `CASE WHEN ${column} IS NULL THEN 'Sem registro' WHEN ${column} = '' THEN 'Valor vazio' ELSE ${column} END`;
  const declarationOverview = (
    natureza: RecutNature | '' = '',
  ): DeclarationOverview => ({
    campos: (
      Object.entries(declarationColumns) as [
        DeclarationField,
        { nome: string; sql: string; joins: string },
      ][]
    ).map(([id, field]) => {
      const natureWhere = natureza ? 'WHERE f.natureza = ?' : '';
      const values = rows<Count>(
        `SELECT ${valueIdentity(field.sql)} id, ${valueLabel(field.sql)} nome,
                COUNT(DISTINCT f.id) total FROM fonte f ${field.joins} ${natureWhere}
         GROUP BY id, nome ORDER BY total DESC, fold(nome)`,
        natureza ? [natureza] : [],
      );
      return { id, nome: field.nome, valores: values };
    }),
  });

  const declarationRecords = (
    filters: DeclarationFilters,
  ): PagedRecords<Source> => {
    const field = declarationColumns[filters.campo];
    const clauses: string[] = [];
    const params: SqlValue[] = [];
    if (filters.valor === '__sem_registro__')
      clauses.push(`${field.sql} IS NULL`);
    else if (filters.valor === '__valor_vazio__')
      clauses.push(`${field.sql} = ''`);
    else {
      clauses.push(`${field.sql} = ?`);
      const prefix = '__texto__:';
      if (filters.valor.startsWith(prefix)) {
        const hex = filters.valor.slice(prefix.length);
        const bytes =
          hex.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? [];
        params.push(new TextDecoder().decode(new Uint8Array(bytes)));
      } else {
        params.push(filters.valor);
      }
    }
    if (filters.natureza) {
      clauses.push('f.natureza = ?');
      params.push(filters.natureza);
    }
    const where = 'WHERE ' + clauses.join(' AND ');
    const total = rows<{ total: number }>(
      `SELECT COUNT(DISTINCT f.id) total FROM fonte f ${field.joins} ${where}`,
      params,
    )[0].total;
    const pagina = Math.min(
      Math.max(1, filters.pagina),
      Math.max(1, Math.ceil(total / PAGE_SIZE)),
    );
    return {
      total,
      pagina,
      tamanho: PAGE_SIZE,
      itens: rows<Source>(
        `SELECT DISTINCT f.id, f.nome, f.descricao, f.status_triagem, f.natureza, t.nome tipo
         FROM fonte f LEFT JOIN tipo t ON t.id = f.tipo_id ${field.joins} ${where}
         ORDER BY fold(f.nome), f.id LIMIT ? OFFSET ?`,
        [...params, PAGE_SIZE, (pagina - 1) * PAGE_SIZE],
      ),
    };
  };

  const provenanceOverview = (): ProvenanceOverview => {
    const counts = rows<{
      totalOrigens: number;
      totalRelacoes: number;
      fichasComOrigem: number;
      origensReferenciadas: number;
    }>(`
      SELECT
        (SELECT COUNT(*) FROM origem) totalOrigens,
        (SELECT COUNT(*) FROM fonte_origem) totalRelacoes,
        (SELECT COUNT(DISTINCT fonte_id) FROM fonte_origem) fichasComOrigem,
        (SELECT COUNT(*) FROM origem WHERE fonte_referenciada_id IS NOT NULL) origensReferenciadas
    `)[0];
    return {
      ...counts,
      porPapel: rows<Count>(`
        SELECT tipo_origem id, tipo_origem nome, COUNT(*) total
        FROM fonte_origem GROUP BY tipo_origem ORDER BY total DESC, fold(tipo_origem)
      `),
      origens: rows<ProvenanceOrigin>(`
        SELECT o.id, o.valor_original nome,
               o.fonte_referenciada_id, f.nome fonte_referenciada_nome,
               f.natureza fonte_referenciada_natureza,
               COUNT(DISTINCT fo.fonte_id) total
        FROM origem o
        LEFT JOIN fonte f ON f.id = o.fonte_referenciada_id
        LEFT JOIN fonte_origem fo ON fo.origem_id = o.id
        GROUP BY o.id
        ORDER BY total DESC, fold(o.valor_original), o.id
      `),
    };
  };

  const provenanceOrigin = (
    id: string,
    requestedPage = 1,
  ): ProvenanceOriginDetail | null => {
    const origin = rows<ProvenanceOrigin>(
      `
      SELECT o.id, o.valor_original nome, o.fonte_referenciada_id,
             f.nome fonte_referenciada_nome, f.natureza fonte_referenciada_natureza,
             (SELECT COUNT(DISTINCT fo.fonte_id) FROM fonte_origem fo WHERE fo.origem_id = o.id) total
      FROM origem o LEFT JOIN fonte f ON f.id = o.fonte_referenciada_id
      WHERE o.id = ?
    `,
      [id],
    )[0];
    if (!origin) return null;
    const total = origin.total;
    const pagina = Math.min(
      Math.max(1, requestedPage),
      Math.max(1, Math.ceil(total / PAGE_SIZE)),
    );
    const items = rows<
      Omit<ProvenanceSource, 'categorias' | 'papeis'> & {
        papeis_registrados: string;
        url_count: number;
      }
    >(
      `
      SELECT f.id, f.nome, f.descricao, f.status_triagem, f.natureza,
             t.nome tipo, group_concat(DISTINCT fo.tipo_origem) papeis_registrados,
             (SELECT COUNT(*) FROM fonte_url fu WHERE fu.fonte_id = f.id) url_count
      FROM fonte_origem fo JOIN fonte f ON f.id = fo.fonte_id
      LEFT JOIN tipo t ON t.id = f.tipo_id
      WHERE fo.origem_id = ?
      GROUP BY f.id
      ORDER BY fold(f.nome), f.id LIMIT ? OFFSET ?
    `,
      [id, PAGE_SIZE, (pagina - 1) * PAGE_SIZE],
    );
    const itemIds = items.map((item) => item.id);
    const categoriesBySource = new Map<string, Category[]>();
    if (itemIds.length) {
      for (const category of rows<Category & { fonte_id: string }>(
        `SELECT fc.fonte_id, c.* FROM fonte_categoria fc
         JOIN categoria c ON c.id = fc.categoria_id
         WHERE fc.fonte_id IN (${itemIds.map(() => '?').join(',')})
         ORDER BY fold(c.nome), c.id`,
        itemIds,
      )) {
        const existing = categoriesBySource.get(category.fonte_id) ?? [];
        existing.push(category);
        categoriesBySource.set(category.fonte_id, existing);
      }
    }
    return {
      origem: origin,
      fontes: {
        total,
        pagina,
        tamanho: PAGE_SIZE,
        itens: items.map(({ papeis_registrados, url_count, ...item }) => ({
          ...item,
          papeis: papeis_registrados ? papeis_registrados.split(',') : [],
          urls: url_count,
          categorias: categoriesBySource.get(item.id) ?? [],
        })),
      },
    };
  };

  const coverageMap = (
    filters: Filters | CategoryFilterExpression = {},
  ): CoverageMap => {
    const scoped =
      'pagina' in filters
        ? searchWhere({ ...filters, natureza: 'fonte' })
        : categoryExpressionSql(filters, 'f.id');
    const categoryWhere = scoped.clauses.length
      ? 'AND ' + scoped.clauses.join(' AND ')
      : '';
    const categoryParams = scoped.params;
    const states = rows<
      Omit<StateCoverage, 'total'> & {
        regional_total: number;
        national_total: number;
        national_overlap: number;
      }
    >(
      `
        WITH cobertura AS (
          SELECT fa.fonte_id, au.uf_codigo_ibge
          FROM fonte_abrangencia fa
          JOIN abrangencia a ON a.id = fa.abrangencia_id
          JOIN abrangencia_uf au ON au.abrangencia_id = a.id
          WHERE fa.papel = 'cobertura' AND fa.fonte_id IN (SELECT f.id FROM fonte f WHERE natureza = 'fonte' ${categoryWhere})
          UNION
          SELECT fa.fonte_id, m.uf_codigo_ibge
          FROM fonte_abrangencia fa
          JOIN abrangencia a ON a.id = fa.abrangencia_id
          JOIN abrangencia_municipio am ON am.abrangencia_id = a.id
          JOIN municipio m ON m.codigo_ibge = am.municipio_codigo_ibge
          WHERE fa.papel = 'cobertura' AND fa.fonte_id IN (SELECT f.id FROM fonte f WHERE natureza = 'fonte' ${categoryWhere})
        ), nacional AS (
          SELECT DISTINCT fa.fonte_id
          FROM fonte_abrangencia fa
          JOIN abrangencia a ON a.id = fa.abrangencia_id
          WHERE fa.papel = 'cobertura' AND a.nacional = 1
            AND fa.fonte_id IN (SELECT f.id FROM fonte f WHERE natureza = 'fonte' ${categoryWhere})
        ), nacional_por_uf AS (
          SELECT c.uf_codigo_ibge, COUNT(DISTINCT c.fonte_id) total
          FROM cobertura c JOIN nacional n ON n.fonte_id = c.fonte_id
          GROUP BY c.uf_codigo_ibge
        )
        SELECT CAST(u.codigo_ibge AS TEXT) id, u.nome, u.sigla,
               COUNT(DISTINCT c.fonte_id) regional_total,
               (SELECT COUNT(*) FROM nacional) national_total,
               COALESCE(npu.total, 0) national_overlap
        FROM uf u
        LEFT JOIN cobertura c ON c.uf_codigo_ibge = u.codigo_ibge
        LEFT JOIN nacional_por_uf npu ON npu.uf_codigo_ibge = u.codigo_ibge
        GROUP BY u.codigo_ibge
        ORDER BY fold(u.nome), u.codigo_ibge
      `,
      [...categoryParams, ...categoryParams, ...categoryParams],
    ).map((item) => {
      const nationalIncrement = Math.max(
        0,
        item.national_total - item.national_overlap,
      );
      return {
        id: item.id,
        nome: item.nome,
        sigla: item.sigla,
        total: item.regional_total + nationalIncrement,
      };
    });
    const municipalities = rows<
      Omit<MunicipalityCoverage, 'total'> & {
        regional_total: number;
        national_total: number;
        national_overlap: number;
      }
    >(
      `
        WITH cobertura AS (
          SELECT fa.fonte_id, am.municipio_codigo_ibge
          FROM fonte_abrangencia fa JOIN abrangencia a ON a.id = fa.abrangencia_id
          JOIN abrangencia_municipio am ON am.abrangencia_id = a.id
          WHERE fa.papel = 'cobertura' AND fa.fonte_id IN (SELECT f.id FROM fonte f WHERE natureza = 'fonte' ${categoryWhere})
          UNION
          SELECT fa.fonte_id, m.codigo_ibge
          FROM fonte_abrangencia fa JOIN abrangencia a ON a.id = fa.abrangencia_id
          JOIN abrangencia_uf au ON au.abrangencia_id = a.id
          JOIN municipio m ON m.uf_codigo_ibge = au.uf_codigo_ibge
          WHERE fa.papel = 'cobertura' AND fa.fonte_id IN (SELECT f.id FROM fonte f WHERE natureza = 'fonte' ${categoryWhere})
        ), nacional AS (
          SELECT DISTINCT fa.fonte_id
          FROM fonte_abrangencia fa JOIN abrangencia a ON a.id = fa.abrangencia_id
          WHERE fa.papel = 'cobertura' AND a.nacional = 1
            AND fa.fonte_id IN (SELECT f.id FROM fonte f WHERE natureza = 'fonte' ${categoryWhere})
        ), nacional_por_municipio AS (
          SELECT c.municipio_codigo_ibge, COUNT(DISTINCT c.fonte_id) total
          FROM cobertura c JOIN nacional n ON n.fonte_id = c.fonte_id
          GROUP BY c.municipio_codigo_ibge
        )
        SELECT CAST(m.codigo_ibge AS TEXT) id, m.nome,
               CAST(m.uf_codigo_ibge AS TEXT) uf, u.sigla uf_sigla,
               COUNT(DISTINCT c.fonte_id) regional_total,
               (SELECT COUNT(*) FROM nacional) national_total,
               COALESCE(npm.total, 0) national_overlap
        FROM municipio m JOIN uf u ON u.codigo_ibge = m.uf_codigo_ibge
        LEFT JOIN cobertura c ON c.municipio_codigo_ibge = m.codigo_ibge
        LEFT JOIN nacional_por_municipio npm ON npm.municipio_codigo_ibge = m.codigo_ibge
        GROUP BY m.codigo_ibge ORDER BY fold(m.nome), m.codigo_ibge
      `,
      [...categoryParams, ...categoryParams, ...categoryParams],
    ).map((item) => {
      const nationalIncrement = Math.max(
        0,
        item.national_total - item.national_overlap,
      );
      return {
        id: item.id,
        nome: item.nome,
        uf: item.uf,
        uf_sigla: item.uf_sigla,
        total: item.regional_total + nationalIncrement,
      };
    });
    return {
      states,
      municipalities,
    };
  };
  function searchWhere(filters: Filters) {
    const clauses: string[] = [];
    const params: SqlValue[] = [];
    const add = (sql: string, ...values: SqlValue[]) => {
      clauses.push(sql);
      params.push(...values);
    };
    if (filters.natureza && filters.natureza !== 'todos')
      add('f.natureza = ?', filters.natureza);
    if (filters.portalId)
      add(
        'EXISTS (SELECT 1 FROM fonte_portal fp WHERE fp.fonte_id = f.id AND fp.portal_id = ?)',
        filters.portalId,
      );
    if (filters.q.trim()) {
      const query = fold(filters.q.trim());
      add(
        '(instr(fold(f.nome), ?) > 0 OR instr(fold(f.descricao), ?) > 0)',
        query,
        query,
      );
    }
    if (filters.categorias?.length) {
      const categoryIds = filters.categorias;
      add(
        `EXISTS (SELECT 1 FROM fonte_categoria fc WHERE fc.fonte_id = f.id AND fc.categoria_id IN (${categoryIds.map(() => '?').join(',')}))`,
        ...categoryIds,
      );
    }
    const expression = categoryExpressionSql(
      filters.categoryFilter ?? {},
      'f.id',
    );
    clauses.push(...expression.clauses);
    params.push(...expression.params);
    const categoryIds = selectedValues(
      filters.tableFilters?.categoria ?? filters.categoria,
    );
    if (categoryIds.length)
      add(
        `EXISTS (SELECT 1 FROM fonte_categoria fc WHERE fc.fonte_id = f.id AND fc.categoria_id IN (${categoryIds.map(() => '?').join(',')}))`,
        ...categoryIds,
      );
    const tipo = selectedValues(filters.tableFilters?.tipo ?? filters.tipo);
    addSelectionPredicate('f.tipo_id', tipo, clauses, params, 'sem-tipo');
    const triagem = selectedValues(
      filters.tableFilters?.triagem ?? filters.triagem,
    );
    addSelectionPredicate(
      'f.status_triagem',
      triagem,
      clauses,
      params,
      'sem-registro',
      '__valor_vazio__',
    );
    function addTerritories(ufIds: string[], municipalityIds: string[]) {
      if (ufIds.length || municipalityIds.length) {
        const territories: string[] = ['a.nacional = 1'];
        const ids: SqlValue[] = [];
        if (ufIds.length) {
          const placeholders = ufIds.map(() => '?').join(',');
          territories.push(`EXISTS (
          SELECT 1 FROM abrangencia_uf au WHERE au.abrangencia_id = a.id
            AND au.uf_codigo_ibge IN (${placeholders})
        )`);
          territories.push(`EXISTS (
          SELECT 1 FROM abrangencia_municipio am JOIN municipio m
            ON m.codigo_ibge = am.municipio_codigo_ibge
          WHERE am.abrangencia_id = a.id AND m.uf_codigo_ibge IN (${placeholders})
        )`);
          ids.push(...ufIds, ...ufIds);
        }
        if (municipalityIds.length) {
          const placeholders = municipalityIds.map(() => '?').join(',');
          territories.push(`EXISTS (
          SELECT 1 FROM abrangencia_municipio am
          WHERE am.abrangencia_id = a.id
            AND am.municipio_codigo_ibge IN (${placeholders})
        )`);
          territories.push(`EXISTS (
          SELECT 1 FROM abrangencia_uf au
          WHERE au.abrangencia_id = a.id AND au.uf_codigo_ibge IN (
            SELECT m.uf_codigo_ibge FROM municipio m
            WHERE m.codigo_ibge IN (${placeholders})
          )
        )`);
          ids.push(...municipalityIds, ...municipalityIds);
        }
        add(
          `EXISTS (SELECT 1 FROM fonte_abrangencia fa JOIN abrangencia a ON a.id = fa.abrangencia_id
        WHERE fa.fonte_id = f.id AND fa.papel = 'cobertura' AND (${territories.join(' OR ')}))`,
          ...ids,
        );
      }
    }
    addTerritories(
      selectedValues(filters.ufs ?? filters.uf),
      selectedValues(filters.municipios ?? filters.municipio),
    );
    addTablePredicates(sourceFields, filters.tableFilters, clauses, params);
    return {
      clauses,
      params,
      where: clauses.length ? 'WHERE ' + clauses.join(' AND ') : '',
    };
  }
  const search = (filters: Filters) => {
    const { where, params } = searchWhere(filters);
    const totals = rows<SearchResult['totals']>(
      `SELECT
        COUNT(CASE WHEN f.natureza = 'fonte' THEN 1 END) fonte,
        COUNT(CASE WHEN f.natureza = 'ferramenta' THEN 1 END) ferramenta
      FROM fonte f ${where}`,
      params,
    )[0];
    const total = totals.fonte + totals.ferramenta;
    const page = Math.min(
      filters.pagina,
      Math.max(1, Math.ceil(total / PAGE_SIZE)),
    );
    const order = tableOrder(
      sourceFields,
      filters.tableSort,
      `fold(f.nome) ${filters.ordem === 'desc' ? 'DESC' : 'ASC'}`,
    );
    const items = rows<Source>(
      `SELECT f.*, t.nome tipo,
          ${sourceFields.categoria.sql} categorias_texto,
          ${sourceFields.portais.sql} portais_texto,
          ${sourceFields.categorias_classificadas.sql} categorias_classificadas_texto,
          ${sourceFields.portais_papeis.sql} portais_papeis_texto,
          ${sourceFields.cobertura.sql} cobertura_texto,
          ${sourceFields.localidade.sql} localidade_texto,
          ${sourceFields.proveniencia.sql} proveniencia_texto,
          ${sourceFields.urls_texto.sql} urls_texto,
          ${sourceFields.urls.sql} urls,
          sv.valor_original status_validacao
        FROM fonte f
        LEFT JOIN tipo t ON t.id = f.tipo_id
        LEFT JOIN status_validacao sv ON sv.id = f.status_validacao_id
        ${where}
        ORDER BY ${order}
        LIMIT ? OFFSET ?`,
      [...params, PAGE_SIZE, (page - 1) * PAGE_SIZE],
    );
    return { total, totals, page, items };
  };

  const recutSummary = (
    categoryFilter: CategoryFilterExpression,
    natureza: RecutAudience,
  ): RecutSummary => {
    const expression = categoryExpressionSql(categoryFilter, 'f.id');
    if (!expression.clauses.length)
      return { total: 0, porTipo: [], porTriagem: [], porUf: [] };
    const natureClause = natureza === 'todos' ? [] : ['f.natureza = ?'];
    const params: SqlValue[] = [
      ...(natureza === 'todos' ? [] : [natureza]),
      ...expression.params,
    ];
    const where = `WHERE ${[...natureClause, ...expression.clauses].join(' AND ')}`;
    const total = rows<{ total: number }>(
      `SELECT COUNT(*) total FROM fonte f ${where}`,
      params,
    )[0].total;
    const porTipo = rows<Count>(
      `SELECT COALESCE(t.id, 'sem-tipo') id, COALESCE(t.nome, 'Tipo não informado') nome,
              COUNT(DISTINCT f.id) total
       FROM fonte f LEFT JOIN tipo t ON t.id = f.tipo_id ${where}
       GROUP BY t.id ORDER BY total DESC, fold(COALESCE(t.nome, 'Tipo não informado')), id`,
      params,
    );
    const porTriagem = rows<Count>(
      `SELECT COALESCE(f.status_triagem, 'sem-registro') id,
              COALESCE(f.status_triagem, 'Sem estado informado') nome,
              COUNT(DISTINCT f.id) total
       FROM fonte f ${where}
       GROUP BY f.status_triagem ORDER BY total DESC, fold(nome), id`,
      params,
    );
    const porUf =
      natureza !== 'ferramenta'
        ? rows<Count>(
            `WITH selecionadas AS (
               SELECT f.id FROM fonte f ${where}
             ), cobertura AS (
               SELECT fa.fonte_id, au.uf_codigo_ibge
               FROM fonte_abrangencia fa JOIN selecionadas s ON s.id = fa.fonte_id
               JOIN abrangencia_uf au ON au.abrangencia_id = fa.abrangencia_id
               WHERE fa.papel = 'cobertura'
               UNION
               SELECT fa.fonte_id, m.uf_codigo_ibge
               FROM fonte_abrangencia fa JOIN selecionadas s ON s.id = fa.fonte_id
               JOIN abrangencia_municipio am ON am.abrangencia_id = fa.abrangencia_id
               JOIN municipio m ON m.codigo_ibge = am.municipio_codigo_ibge
               WHERE fa.papel = 'cobertura'
             ), nacional AS (
               SELECT DISTINCT fa.fonte_id
               FROM fonte_abrangencia fa
               JOIN abrangencia a ON a.id = fa.abrangencia_id
               JOIN selecionadas s ON s.id = fa.fonte_id
               WHERE fa.papel = 'cobertura' AND a.nacional = 1
             ), por_uf AS (
               SELECT fonte_id, uf_codigo_ibge FROM cobertura
               UNION
               SELECT n.fonte_id, u.codigo_ibge FROM nacional n CROSS JOIN uf u
             )
             SELECT CAST(u.codigo_ibge AS TEXT) id, u.nome, COUNT(DISTINCT p.fonte_id) total
             FROM por_uf p JOIN uf u ON u.codigo_ibge = p.uf_codigo_ibge
             GROUP BY u.codigo_ibge ORDER BY total DESC, fold(u.nome), id`,
            params,
          )
        : [];
    return { total, porTipo, porTriagem, porUf };
  };
  const detail = (id: string): Detail | null => {
    const fonte = rows<Detail['fonte']>(
      `SELECT f.*, t.nome tipo, sv.valor_original validacao FROM fonte f
      LEFT JOIN tipo t ON t.id = f.tipo_id LEFT JOIN status_validacao sv ON sv.id = f.status_validacao_id
      WHERE f.id = ?`,
      [id],
    )[0];
    if (!fonte) return null;
    return {
      fonte,
      categorias: rows<Category>(
        `SELECT c.* FROM fonte_categoria fc JOIN categoria c ON c.id = fc.categoria_id
        WHERE fc.fonte_id = ? ORDER BY fold(c.nome), c.id`,
        [id],
      ),
      urls: rows<Detail['urls'][number]>(
        'SELECT id, nome, papel, url FROM fonte_url WHERE fonte_id = ? ORDER BY ordem, id',
        [id],
      ),
      origens: rows<Detail['origens'][number]>(
        `SELECT fo.tipo_origem, o.valor_original, f.id fonte_id, f.nome, f.natureza
        FROM fonte_origem fo JOIN origem o ON o.id = fo.origem_id LEFT JOIN fonte f ON f.id = o.fonte_referenciada_id
        WHERE fo.fonte_id = ? ORDER BY fo.tipo_origem`,
        [id],
      ),
      portais: rows<Detail['portais'][number]>(
        `SELECT p.id, p.nome, p.tipo, p.url_base, p.portal_pai_id,
                parent.nome portal_pai_nome, fp.papel
         FROM fonte_portal fp JOIN portal p ON p.id = fp.portal_id
         LEFT JOIN portal parent ON parent.id = p.portal_pai_id
         WHERE fp.fonte_id = ? ORDER BY p.tipo, fold(p.nome), p.id, fp.papel`,
        [id],
      ),
      abrangencias: rows<
        Omit<Detail['abrangencias'][number], 'ufs' | 'municipios'> & {
          id: string;
        }
      >(
        'SELECT a.*, fa.papel FROM fonte_abrangencia fa JOIN abrangencia a ON a.id = fa.abrangencia_id WHERE fa.fonte_id = ? ORDER BY fa.papel',
        [id],
      ).map((coverage) => ({
        ...coverage,
        ufs: rows<Item>(
          `SELECT CAST(u.codigo_ibge AS TEXT) id, u.nome FROM abrangencia_uf au
          JOIN uf u ON u.codigo_ibge = au.uf_codigo_ibge WHERE au.abrangencia_id = ? ORDER BY fold(u.nome)`,
          [coverage.id],
        ),
        municipios: rows<Municipality>(
          `SELECT CAST(m.codigo_ibge AS TEXT) id, m.nome || ' / ' || u.sigla nome, CAST(u.codigo_ibge AS TEXT) uf
          FROM abrangencia_municipio am JOIN municipio m ON m.codigo_ibge = am.municipio_codigo_ibge
          JOIN uf u ON u.codigo_ibge = m.uf_codigo_ibge WHERE am.abrangencia_id = ? ORDER BY fold(m.nome), u.sigla`,
          [coverage.id],
        ),
      })),
    };
  };
  const graph = (kind: NodeKind, id: string, offset = 0): Graph | null => {
    const tables = {
      fonte: ['fonte', 'nome'],
      ferramenta: ['fonte', 'nome'],
      categoria: ['categoria', 'nome'],
      origem: ['origem', 'valor_original'],
    };
    const [table, label] = tables[kind];
    const item = rows<Item>(
      `SELECT id, ${label} nome FROM ${table} WHERE id = ?`,
      [id],
    )[0];
    if (!item) return null;
    const queries = {
      fonte: `
        SELECT c.id, c.nome, 'categoria' kind, 'Classificação' relacao, 'out' direction
        FROM fonte_categoria fc JOIN categoria c ON c.id = fc.categoria_id WHERE fc.fonte_id = ?
        UNION
        SELECT COALESCE(f.id, o.id), COALESCE(f.nome, o.valor_original),
               CASE WHEN f.id IS NULL THEN 'origem' ELSE f.natureza END, 'Origem', 'out'
        FROM fonte_origem fo JOIN origem o ON o.id = fo.origem_id
        LEFT JOIN fonte f ON f.id = o.fonte_referenciada_id WHERE fo.fonte_id = ?
        UNION
        SELECT f.id, f.nome, f.natureza, 'Cita esta ficha', 'in'
        FROM origem o JOIN fonte_origem fo ON fo.origem_id = o.id
        JOIN fonte f ON f.id = fo.fonte_id WHERE o.fonte_referenciada_id = ?
      `,
      ferramenta: `
        SELECT c.id, c.nome, 'categoria' kind, 'Classificação' relacao, 'out' direction
        FROM fonte_categoria fc JOIN categoria c ON c.id = fc.categoria_id WHERE fc.fonte_id = ?
        UNION
        SELECT COALESCE(f.id, o.id), COALESCE(f.nome, o.valor_original),
               CASE WHEN f.id IS NULL THEN 'origem' ELSE f.natureza END, 'Origem', 'out'
        FROM fonte_origem fo JOIN origem o ON o.id = fo.origem_id
        LEFT JOIN fonte f ON f.id = o.fonte_referenciada_id WHERE fo.fonte_id = ?
        UNION
        SELECT f.id, f.nome, f.natureza, 'Cita esta ficha', 'in'
        FROM origem o JOIN fonte_origem fo ON fo.origem_id = o.id
        JOIN fonte f ON f.id = fo.fonte_id WHERE o.fonte_referenciada_id = ?
      `,
      categoria: `SELECT f.id, f.nome, f.natureza kind, 'Classificação' relacao, 'in' direction
        FROM fonte_categoria fc JOIN fonte f ON f.id = fc.fonte_id WHERE fc.categoria_id = ?`,
      origem: `SELECT DISTINCT f.id, f.nome, f.natureza kind, 'Cita esta origem' relacao, 'in' direction
        FROM fonte_origem fo JOIN fonte f ON f.id = fo.fonte_id WHERE fo.origem_id = ?`,
    };
    const sql = queries[kind];
    const params =
      kind === 'fonte' || kind === 'ferramenta' ? [id, id, id] : [id];
    const total = rows<{ total: number }>(
      `SELECT COUNT(*) total FROM (${sql})`,
      params,
    )[0].total;
    return {
      center: { ...item, kind },
      total,
      neighbors: rows<Neighbor>(
        `SELECT * FROM (${sql}) ORDER BY fold(nome), kind, id, relacao, direction LIMIT ? OFFSET ?`,
        [...params, GRAPH_LIMIT, offset],
      ),
    };
  };
  return {
    satelliteLayers,
    options,
    dashboard,
    catalogOverview,
    portals,
    portal,
    curationSummary,
    curationRecords,
    declarationOverview,
    declarationRecords,
    provenanceOverview,
    provenanceOrigin,
    coverageMap,
    search,
    recutSummary,
    detail,
    graph,
  };
}

export type Catalog = ReturnType<typeof openCatalog>;
