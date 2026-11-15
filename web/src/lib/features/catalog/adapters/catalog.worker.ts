import initSqlJs from 'sql.js';
import wasm from 'sql.js/dist/sql-wasm.wasm?url';
import { openCatalog } from './sqlite-catalog';
import type { Catalog } from './sqlite-catalog';

type Operation = keyof Catalog;
type Request = {
  id: number;
  url: string;
  operation: Operation;
  args: unknown[];
};

let database: Promise<Catalog> | undefined;
async function load(url: string) {
  const [sqlite, response] = await Promise.all([
    initSqlJs({ locateFile: () => wasm }),
    fetch(url),
  ]);
  if (!response.ok) throw new Error('Falha ao baixar o catálogo');
  return openCatalog(
    new sqlite.Database(new Uint8Array(await response.arrayBuffer())),
  );
}

self.addEventListener('message', async ({ data }: MessageEvent<Request>) => {
  const { id, operation, url, args } = data;
  try {
    database ??= load(url).catch((error: unknown) => {
      database = undefined;
      throw error;
    });
    const catalog = await database;
    const run = catalog[operation] as (...params: unknown[]) => unknown;
    self.postMessage({ id, result: await run(...args) });
  } catch {
    self.postMessage({ id, error: 'Não foi possível ler o catálogo.' });
  }
});
