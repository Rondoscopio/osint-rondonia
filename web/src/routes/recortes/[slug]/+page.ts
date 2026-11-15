import { error } from '@sveltejs/kit';
import { getRecut, RECUTS } from '$lib/shared/recuts';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () =>
  RECUTS.map(({ slug }) => ({ slug }));

export const load: PageLoad = ({ params }) => {
  const recut = getRecut(params.slug);
  if (!recut) error(404, 'Este recorte não existe.');
  return { slug: recut.slug };
};
