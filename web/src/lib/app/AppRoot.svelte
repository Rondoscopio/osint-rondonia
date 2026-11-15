<script lang="ts">
  import { browser } from '$app/environment';
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
  import { setContext, type Snippet } from 'svelte';
  import { createAppContainer } from './container';
  import { APP_CONTAINER } from './tokens';
  import AppView from '$lib/views/AppView.svelte';
  import '@fontsource-variable/dm-sans';
  import '../../app.css';

  let { children }: { children: Snippet } = $props();
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        enabled: browser,
        staleTime: Infinity,
        gcTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: false,
      },
    },
  });
  setContext(APP_CONTAINER, createAppContainer());
</script>

<QueryClientProvider client={queryClient}>
  <AppView>
    {@render children()}
  </AppView>
</QueryClientProvider>
