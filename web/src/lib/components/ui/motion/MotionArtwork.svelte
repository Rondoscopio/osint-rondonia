<script lang="ts">
  import { getContext, onMount, type Snippet } from 'svelte';
  import { MOTION_PREFERENCE } from './preference';

  let {
    children,
    speed = 1,
    intensity = 1,
    paused = false,
    variant,
  }: {
    children: Snippet;
    variant: string;
    speed?: number;
    intensity?: number;
    paused?: boolean;
  } = $props();

  const animationsPaused = getContext<(() => boolean) | undefined>(
    MOTION_PREFERENCE,
  );
  let frame: HTMLDivElement;
  let inView = $state(false);
  let tabVisible = $state(false);

  onMount(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const syncVisibility = () => {
      tabVisible = document.visibilityState === 'visible';
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = Boolean(
          entry?.isIntersecting && entry.intersectionRatio >= 0.1,
        );
      },
      { threshold: 0.1 },
    );
    observer.observe(frame);
    syncVisibility();
    document.addEventListener('visibilitychange', syncVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', syncVisibility);
    };
  });
</script>

<div
  class="motion-art"
  aria-hidden="true"
  data-artwork={variant}
  data-playing={inView && tabVisible && !paused && !animationsPaused?.()}
  style:--art-speed={Math.min(1.5, Math.max(0.65, speed))}
  style:--art-intensity={Math.min(1, Math.max(0, intensity))}
  bind:this={frame}
>
  {@render children()}
</div>

<style>
  .motion-art {
    --art-line: color-mix(in srgb, var(--brand) 55%, var(--border));
    --art-grid: color-mix(in srgb, var(--brand) 17%, transparent);
    --art-ink: var(--brand-strong);
    --art-soft: color-mix(in srgb, var(--brand) 18%, var(--surface));
    --art-light: var(--accent);
    pointer-events: none;
    user-select: none;
    min-width: 0;
    opacity: var(--art-intensity);
  }
  .motion-art :global(svg) {
    display: block;
    width: 100%;
    height: auto;
    overflow: hidden;
  }
  .motion-art[data-playing='false'] :global(.motion-part) {
    animation-play-state: paused;
  }
  @media (prefers-reduced-motion: reduce) {
    .motion-art :global(.motion-part) {
      animation: none;
    }
  }
</style>
