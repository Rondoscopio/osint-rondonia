import tsParser from '@typescript-eslint/parser';
import svelteParser from 'svelte-eslint-parser';
import svelte from 'eslint-plugin-svelte';
import layers from './lint/layers.js';

const outsideComponents = ['src/**/*.svelte'];

export default [
  {
    ignores: [
      '.svelte-kit/**',
      'build/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  {
    files: ['src/**/*.{ts,js,svelte}'],
    linterOptions: {
      noInlineConfig: true,
      reportUnusedDisableDirectives: 'error',
    },
    plugins: { layers, svelte },
    rules: {
      'layers/dependencies': 'error',
      'svelte/no-at-html-tags': 'error',
    },
  },
  {
    files: ['src/**/*.{ts,js}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { sourceType: 'module', ecmaVersion: 'latest' },
    },
  },
  {
    files: ['src/**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tsParser,
        sourceType: 'module',
        ecmaVersion: 'latest',
        extraFileExtensions: ['.svelte'],
      },
    },
  },
  {
    files: outsideComponents,
    ignores: ['src/lib/components/**/*.svelte'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'SvelteElement[kind="html"]',
          message:
            'Marcação HTML/SVG pertence a lib/components/; esta camada deve compor componentes.',
        },
        {
          selector: 'SvelteElement[name.name="svelte:element"]',
          message: 'Tags dinâmicas pertencem a componentes em lib/components/.',
        },
        {
          selector: 'SvelteElement[name.name="svelte:head"]',
          message: 'Metadados devem usar PageMeta em lib/components/.',
        },
        {
          selector: 'SvelteStyleElement',
          message: 'Estilos locais pertencem a componentes em lib/components/.',
        },
      ],
    },
  },
  {
    files: ['src/lib/components/**/*.svelte'],
    ignores: ['src/lib/components/ui/TextField.svelte'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'SvelteElement[name.name="select"]',
          message:
            'Use o SelectField de Bits UI; HTML nativo fica reservado a controles sem equivalente na biblioteca.',
        },
        {
          selector: 'SvelteElement[name.name="button"]',
          message: 'Use Button.Root de Bits UI para ações e links de ação.',
        },
        {
          selector: 'SvelteElement[name.name="input"]',
          message:
            'Use TextField; o input nativo fica encapsulado nesse componente porque Bits UI não fornece um campo de texto equivalente.',
        },
        {
          selector: 'SvelteElement[name.name="label"]',
          message:
            'Use Label.Root de Bits UI para associar rótulos a controles.',
        },
      ],
    },
  },
];
