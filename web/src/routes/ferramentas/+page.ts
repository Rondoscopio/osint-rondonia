import { building } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import { tools } from '$lib/links';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
  if (building) return {};
  const id = url.searchParams.get('id');
  if (id) redirect(308, tools({ id }));
  return {};
};
