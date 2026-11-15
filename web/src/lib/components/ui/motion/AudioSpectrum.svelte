<script lang="ts">
  import MotionArtwork from './MotionArtwork.svelte';
  import { spectrumAt } from './synthetic';

  let { seed = 2 }: { seed?: number } = $props();
  const bars = $derived(
    Array.from({ length: 24 }, (_, index) => {
      const position = index / 23;
      return {
        x: 20 + index * 7,
        first: spectrumAt(position, seed, 0),
        middle: spectrumAt(position, seed, Math.PI),
        last: spectrumAt(position, seed, 1.5 * Math.PI),
      };
    }),
  );
</script>

<MotionArtwork variant="spectrum">
  <svg viewBox="0 0 204 106" focusable="false">
    <path
      d="M17 18v65h172M18 31h170M18 48h170M18 65h170m-120-47v65m58-65v65"
      fill="none"
      stroke="var(--art-grid)"
    />
    <path
      d="M20 89h24m38 0h26m34 0h22"
      stroke="var(--art-line)"
      stroke-opacity=".48"
      stroke-linecap="round"
    />
    {#each bars as bar (bar.x)}
      <g
        class="motion-part band"
        style:--first={bar.first}
        style:--middle={bar.middle}
        style:--last={bar.last}
      >
        <rect
          x={bar.x}
          y="19"
          width="4.6"
          height="63"
          rx="1.2"
          fill="var(--art-ink)"
          fill-opacity=".47"
        />
        <path
          d={'M' + bar.x + ' 19h4.6'}
          stroke="var(--art-ink)"
          stroke-width="2"
        />
      </g>
    {/each}
  </svg>
</MotionArtwork>

<style>
  .band {
    transform-origin: 0 82px;
    transform: scaleY(var(--first));
    animation: amplitude calc(13s / var(--art-speed)) ease-in-out infinite;
  }
  @keyframes amplitude {
    0%,
    100% {
      transform: scaleY(var(--first));
    }
    36% {
      transform: scaleY(var(--middle));
    }
    71% {
      transform: scaleY(var(--last));
    }
  }
</style>
