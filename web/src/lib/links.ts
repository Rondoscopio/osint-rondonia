import { resolve } from '$app/paths';

export function sources(
  values: Record<string, string | string[] | number | undefined> = {},
) {
  return catalogRecords('fonte', values);
}

export function tools(
  values: Record<string, string | string[] | number | undefined> = {},
) {
  return catalogRecords('ferramenta', values);
}

export function portalLink(id: string) {
  return resolve('/portais/[id]', { id: encodeURIComponent(id) }) + '/';
}

export function catalogRecords(
  kind: 'fonte' | 'ferramenta',
  values: Record<string, string | string[] | number | undefined> = {},
) {
  const { id, ...filters } = values;
  const path = kind === 'ferramenta' ? '/ferramentas/' : '/fontes/';
  if (id !== undefined && id !== '') {
    const route = kind === 'ferramenta' ? '/ferramentas/[id]' : '/fontes/[id]';
    return resolve(route, { id: encodeURIComponent(String(id)) }) + '/';
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (Array.isArray(value)) {
      for (const item of value) if (item) params.append(key, item);
    } else if (value) params.set(key, String(value));
  }
  return resolve(path) + (params.size ? '?' + params : '');
}

export function httpLink(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' || url.protocol === 'http:') return url.href;
  } catch {
    return null;
  }
  return null;
}
