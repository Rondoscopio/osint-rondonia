<script lang="ts">
  import MotionArtwork from './MotionArtwork.svelte';
  import { surfaceHeight } from './synthetic';

  let { seed = 4 }: { seed?: number } = $props();

  const points = $derived(
    Array.from({ length: 96 }, (_, index) => {
      const column = index % 12;
      const row = Math.floor(index / 12);
      const height = surfaceHeight(column, row, seed);
      return {
        id: index,
        x: 39 + column * 9.6 + row * 4,
        y: 54 + row * 4.4 - height * 23,
        r: 1 + height * 0.72,
        opacity: 0.35 + height * 0.6,
      };
    }),
  );
</script>

<MotionArtwork variant="lidar">
  <svg viewBox="0 0 204 106" focusable="false">
    <path
      d="m30 58 119-14 39 31-121 16zM44 69l118-16M55 79l118-15M58 55l37 32m-5-36 37 33m-6-37 37 33"
      fill="none"
      stroke="var(--art-grid)"
    />
    <path
      d="m39 55 43-10 43 5 45-10m-87 5 21 22 59-10"
      fill="none"
      stroke="var(--art-line)"
      stroke-opacity=".36"
      stroke-dasharray="2 4"
    />
    {#each points as point (point.id)}
      <circle
        cx={point.x}
        cy={point.y}
        r={point.r}
        fill="var(--art-ink)"
        opacity={point.opacity}
      />
    {/each}
    <g class="motion-part scan">
      <path
        d="m27 44 42 31 1-19-42-30z"
        fill="var(--art-soft)"
        fill-opacity=".65"
      />
      <path
        d="m28 27 42 30m-43-13 42 31"
        fill="none"
        stroke="var(--art-line)"
        stroke-opacity=".76"
      />
    </g>
    <path
      d="M25 22h9m-5-4v9m146 58h9m-5-4v9"
      fill="none"
      stroke="var(--art-line)"
      stroke-opacity=".62"
    />
  </svg>
</MotionArtwork>

<style>
  .scan {
    opacity: 0.57;
    animation: scan calc(17s / var(--art-speed)) ease-in-out infinite;
  }
  @keyframes scan {
    0%,
    100% {
      transform: translateX(0);
      opacity: 0.28;
    }
    49%,
    63% {
      transform: translateX(104px);
      opacity: 0.73;
    }
  }
</style>
