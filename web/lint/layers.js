import fs from 'node:fs';
import path from 'node:path';

const sourceRoot = path.resolve('src');
const libRoot = path.resolve('src/lib');

function layer(file) {
  const relative = path.relative(sourceRoot, file).split(path.sep).join('/');
  if (relative.startsWith('routes/')) return 'route';
  if (relative.startsWith('lib/views/')) return 'view';
  if (relative.startsWith('lib/components/ui/')) return 'ui';
  if (relative.startsWith('lib/components/shell/')) return 'shell';
  if (relative.startsWith('lib/components/features/'))
    return 'featureComponent';
  if (relative.startsWith('lib/app/')) return 'composition';
  if (relative.startsWith('lib/shared/')) return 'shared';
  if (relative === 'app.css') return 'shared';
  if (relative === 'lib/links.ts' || relative.startsWith('lib/navigation/'))
    return 'navigation';
  if (/^lib\/features\/[^/]+\/domain\//.test(relative)) return 'domain';
  if (/^lib\/features\/[^/]+\/ports\//.test(relative)) return 'port';
  if (/^lib\/features\/[^/]+\/application\//.test(relative))
    return 'application';
  if (/^lib\/features\/[^/]+\/adapters\//.test(relative)) return 'adapter';
  if (/^lib\/features\//.test(relative)) return 'viewmodel';
  if (relative === 'lib/catalog.ts') return 'domain';
  return 'unclassified';
}

function resolveInternal(specifier, filename) {
  const clean = specifier.split(/[?#]/, 1)[0];
  let candidate;
  if (clean === '$lib') candidate = libRoot;
  else if (clean.startsWith('$lib/'))
    candidate = path.join(libRoot, clean.slice(5));
  else if (clean.startsWith('.'))
    candidate = path.resolve(path.dirname(filename), clean);
  else return null;
  const possibilities = [
    candidate,
    ...['.ts', '.js', '.mjs', '.svelte'].map((ext) => candidate + ext),
    ...['index.ts', 'index.js'].map((name) => path.join(candidate, name)),
  ];
  return (
    possibilities.find(
      (file) => fs.existsSync(file) && fs.statSync(file).isFile(),
    ) ?? null
  );
}

const allowed = {
  route: new Set(['view', 'shared', 'domain', 'navigation']),
  view: new Set([
    'view',
    'ui',
    'shell',
    'featureComponent',
    'viewmodel',
    'domain',
    'port',
    'shared',
    'navigation',
  ]),
  ui: new Set(['ui', 'shared']),
  shell: new Set(['shell', 'ui', 'shared', 'navigation', 'domain']),
  featureComponent: new Set([
    'featureComponent',
    'ui',
    'shared',
    'domain',
    'navigation',
  ]),
  viewmodel: new Set([
    'viewmodel',
    'domain',
    'port',
    'application',
    'shared',
    'composition',
    'navigation',
  ]),
  domain: new Set(['domain', 'shared']),
  port: new Set(['domain', 'shared', 'port']),
  application: new Set(['application', 'domain', 'port', 'shared']),
  adapter: new Set(['adapter', 'domain', 'port', 'shared']),
  shared: new Set(['shared']),
  navigation: new Set(['navigation', 'domain', 'shared']),
  composition: new Set([
    'composition',
    'view',
    'ui',
    'shell',
    'featureComponent',
    'viewmodel',
    'domain',
    'port',
    'application',
    'adapter',
    'shared',
    'navigation',
  ]),
};

const externalAllowed = {
  route: ['svelte', '@sveltejs/kit'],
  view: ['svelte'],
  ui: ['svelte', 'bits-ui', '@tanstack/svelte-table'],
  shell: ['svelte', 'bits-ui'],
  featureComponent: [
    'svelte',
    'bits-ui',
    '@tanstack/svelte-table',
    'maplibre-gl',
    'pmtiles',
  ],
  viewmodel: ['svelte', '@tanstack/svelte-query'],
  domain: [],
  port: [],
  application: [],
  adapter: ['sql.js'],
  shared: [],
  navigation: [],
  composition: [
    'svelte',
    '@tanstack/svelte-query',
    'inversify',
    '@fontsource-variable/dm-sans',
  ],
};

function externalIsAllowed(from, source) {
  return (externalAllowed[from] ?? []).some(
    (name) => source === name || source.startsWith(`${name}/`),
  );
}

function importedSources(node) {
  if (
    (node.type === 'ImportDeclaration' ||
      node.type === 'ExportNamedDeclaration' ||
      node.type === 'ExportAllDeclaration') &&
    node.source
  )
    return [node.source];
  if (node.type === 'ImportExpression') return [node.source];
  if (node.type === 'TSImportType') {
    const parameter = node.parameter;
    const literal =
      parameter?.type === 'Literal' ? parameter : parameter?.literal;
    return literal ? [literal] : [];
  }
  if (
    node.type === 'TSImportEqualsDeclaration' &&
    node.moduleReference?.expression
  )
    return [node.moduleReference.expression];
  if (
    node.type === 'NewExpression' &&
    node.callee?.type === 'Identifier' &&
    node.callee.name === 'Worker' &&
    node.arguments?.length
  )
    return node.arguments[0]?.type === 'NewExpression'
      ? []
      : [node.arguments[0]];
  if (
    node.type === 'NewExpression' &&
    node.callee?.type === 'Identifier' &&
    node.callee.name === 'URL' &&
    node.arguments?.[1]?.type === 'MemberExpression'
  ) {
    const second = node.arguments[1];
    if (
      second.object?.type === 'MetaProperty' &&
      second.object.meta?.name === 'import'
    )
      return [node.arguments[0]];
  }
  return [];
}

export default {
  rules: {
    dependencies: {
      meta: {
        type: 'problem',
        docs: { description: 'enforce OSINT Rondônia dependency direction' },
        schema: [],
        messages: {
          dynamic:
            'A importação interna precisa usar um caminho literal para que a camada de destino seja validada.',
          unresolved: 'Não foi possível resolver o caminho interno {{source}}.',
          external:
            'A camada {{from}} não pode importar a dependência {{source}}.',
          direction:
            'A camada {{from}} não pode depender da camada {{to}} ({{source}}).',
        },
      },
      create(context) {
        const filename = path.resolve(
          context.filename ?? context.getFilename(),
        );
        const from = layer(filename);
        if (
          from === 'unclassified' ||
          !filename.startsWith(sourceRoot + path.sep)
        )
          return {};
        return {
          ImportDeclaration: check,
          ExportNamedDeclaration: check,
          ExportAllDeclaration: check,
          ImportExpression: check,
          TSImportType: check,
          TSImportEqualsDeclaration: check,
          NewExpression: check,
        };
        function check(node) {
          for (const sourceNode of importedSources(node)) {
            if (typeof sourceNode?.value !== 'string') {
              context.report({
                node: sourceNode ?? node,
                messageId: 'dynamic',
              });
              continue;
            }
            const source = sourceNode.value;
            if (source.startsWith('$app/')) {
              if (
                [
                  'ui',
                  'shell',
                  'featureComponent',
                  'view',
                  'route',
                  'viewmodel',
                  'composition',
                ].includes(from)
              )
                continue;
              if (
                source === '$app/paths' &&
                ['adapter', 'navigation'].includes(from)
              )
                continue;
              context.report({
                node: sourceNode,
                messageId: 'direction',
                data: { from, to: 'sveltekit', source },
              });
              continue;
            }
            if (
              !source.startsWith('$lib/') &&
              !source.startsWith('.') &&
              !source.startsWith('$lib')
            ) {
              if (!externalIsAllowed(from, source))
                context.report({
                  node: sourceNode,
                  messageId: 'external',
                  data: { from, source },
                });
              continue;
            }
            const targetFile = resolveInternal(source, filename);
            if (!targetFile) {
              if (source === './$types' && from === 'route') continue;
              context.report({
                node: sourceNode,
                messageId: 'unresolved',
                data: { source },
              });
              continue;
            }
            const to = layer(targetFile);
            const relativeFile = path
              .relative(sourceRoot, filename)
              .split(path.sep)
              .join('/');
            if (
              from === 'route' &&
              to === 'composition' &&
              relativeFile === 'routes/+layout.svelte'
            )
              continue;
            if (!allowed[from]?.has(to))
              context.report({
                node: sourceNode,
                messageId: 'direction',
                data: { from, to, source },
              });
          }
        }
      },
    },
  },
};
