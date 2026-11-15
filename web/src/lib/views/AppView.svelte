<script lang="ts">
  import { onMount, setContext, type Snippet } from 'svelte';
  import { asset } from '$app/paths';
  import AppShell from '$lib/components/shell/AppShell.svelte';
  import {
    MOTION_PREFERENCE,
    MOTION_STORAGE_KEY,
  } from '$lib/components/ui/motion/preference';

  let { children }: { children: Snippet } = $props();
  let motionPaused = $state(false);
  setContext(MOTION_PREFERENCE, () => motionPaused);
  let theme = $state<'light' | 'dark'>(
    typeof document !== 'undefined' &&
      document.documentElement.dataset.theme === 'dark'
      ? 'dark'
      : 'light',
  );

  $effect(() => {
    document.documentElement.dataset.theme = theme;
  });

  onMount(() => {
    try {
      motionPaused = localStorage.getItem(MOTION_STORAGE_KEY) === '1';
      const stored = localStorage.getItem('osint-rondonia-theme');
      if (stored === 'light' || stored === 'dark') {
        theme = stored;
        return;
      }
    } catch {
      // Continue with the system preference when storage is unavailable.
    }
    theme = matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  function toggleMotion() {
    motionPaused = !motionPaused;
    try {
      localStorage.setItem(MOTION_STORAGE_KEY, motionPaused ? '1' : '0');
    } catch {
      // Keep the preference in memory for this visit.
    }
  }

  function toggleTheme() {
    theme = theme === 'light' ? 'dark' : 'light';
    try {
      localStorage.setItem('osint-rondonia-theme', theme);
    } catch {
      // Keep the preference in memory for this visit.
    }
  }
</script>

<AppShell
  buildInfo={__BUILD_INFO__}
  {motionPaused}
  {theme}
  databaseUrl={asset('/' + __CATALOG_FILE__)}
  {toggleMotion}
  {toggleTheme}
>
  {@render children()}
</AppShell>
