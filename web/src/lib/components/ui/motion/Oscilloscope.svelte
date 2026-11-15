<script lang="ts">
  import MotionArtwork from './MotionArtwork.svelte';
  import { waveform } from './synthetic';

  let { seed = 0 }: { seed?: number } = $props();
  const uid = $props.id();
  const signal = $derived(waveform(seed, false));
  const harmonic = $derived(waveform(seed, true));
</script>

<MotionArtwork variant="oscilloscope">
  <svg viewBox="0 0 204 106" focusable="false">
    <defs>
      <clipPath id={uid + '-window'}>
        <rect x="14" y="19" width="176" height="63" rx="4" />
      </clipPath>
    </defs>
    <rect
      x="14"
      y="19"
      width="176"
      height="63"
      rx="4"
      fill="var(--art-soft)"
      fill-opacity=".53"
      stroke="var(--art-grid)"
    />
    <path
      d="M15 35h174M15 51h174M15 67h174M42 20v62m30-62v62m30-62v62m30-62v62m30-62v62"
      stroke="var(--art-grid)"
    />
    <g clip-path={'url(#' + uid + '-window)'} fill="none">
      <g class="motion-part harmonic">
        <path
          d={harmonic}
          stroke="var(--art-line)"
          stroke-opacity=".42"
          stroke-width="1.1"
        />
        <path
          d={harmonic}
          transform="translate(240)"
          stroke="var(--art-line)"
          stroke-opacity=".42"
          stroke-width="1.1"
        />
      </g>
      <g class="motion-part signal">
        <path
          d={signal}
          transform="translate(0 2)"
          stroke="var(--art-line)"
          stroke-opacity=".23"
          stroke-width="2"
        />
        <path d={signal} stroke="var(--art-ink)" stroke-width="1.7" />
        <path
          d={signal}
          transform="translate(240)"
          stroke="var(--art-ink)"
          stroke-width="1.7"
        />
      </g>
    </g>
    <path
      d="M19 90h18m6 0h9m116 0h16"
      stroke="var(--art-line)"
      stroke-opacity=".52"
      stroke-linecap="round"
    />
  </svg>
</MotionArtwork>

<style>
  .signal {
    animation: scroll calc(32s / var(--art-speed)) linear infinite;
  }
  .harmonic {
    animation: scroll calc(45s / var(--art-speed)) linear infinite reverse;
  }
  @keyframes scroll {
    to {
      transform: translateX(-240px);
    }
  }
</style>
