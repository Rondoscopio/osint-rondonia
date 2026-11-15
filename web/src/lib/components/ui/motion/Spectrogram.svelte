<script lang="ts">
  import MotionArtwork from './MotionArtwork.svelte';
  import { spectralBands } from './synthetic';

  let { seed = 3 }: { seed?: number } = $props();
  const uid = $props.id();
  const bands = $derived(spectralBands(seed));
</script>

<MotionArtwork variant="spectrogram">
  <svg viewBox="0 0 204 106" focusable="false">
    <defs>
      <clipPath id={uid + '-window'}>
        <rect x="16" y="18" width="172" height="64" rx="3" />
      </clipPath>
      <linearGradient id={uid + '-energy'} x2="0" y2="1">
        <stop stop-color="var(--art-line)" />
        <stop offset=".62" stop-color="var(--art-ink)" />
        <stop offset="1" stop-color="var(--art-light)" />
      </linearGradient>
    </defs>
    <rect
      x="16"
      y="18"
      width="172"
      height="64"
      rx="3"
      fill="var(--art-soft)"
      fill-opacity=".75"
    />
    <path
      d="M16 31h172M16 44h172M16 57h172M16 70h172m34-52v64m34-64v64m34-64v64m34-64v64"
      fill="none"
      stroke="var(--art-grid)"
    />
    <g clip-path={'url(#' + uid + '-window)'}>
      <g class="motion-part history" fill="none" stroke-linecap="round">
        {#each [14, 194] as offset (offset)}
          <g transform={'translate(' + offset + ')'}>
            {#each bands as band (band.id)}
              <path
                d={band.faint}
                stroke="var(--art-line)"
                stroke-width="2.2"
                opacity={band.strength * 0.46}
              />
              <path
                d={band.strong}
                stroke={'url(#' + uid + '-energy)'}
                stroke-width="4.3"
                opacity={band.strength}
              />
            {/each}
          </g>
        {/each}
      </g>
    </g>
    <path
      d="M16 82h172M23 88h13m52 0h16m57 0h21"
      stroke="var(--art-line)"
      stroke-opacity=".54"
      stroke-linecap="round"
    />
  </svg>
</MotionArtwork>

<style>
  .history {
    animation: advance calc(44s / var(--art-speed)) linear infinite;
  }
  @keyframes advance {
    to {
      transform: translateX(-180px);
    }
  }
</style>
