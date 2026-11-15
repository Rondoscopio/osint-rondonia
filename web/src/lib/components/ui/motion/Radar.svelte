<script lang="ts">
  import MotionArtwork from './MotionArtwork.svelte';
  const uid = $props.id();
  const echoes = [
    { x: 115, y: 37 },
    { x: 129, y: 64 },
    { x: 84, y: 70 },
    { x: 78, y: 42 },
  ].map((point) => {
    const turn = Math.atan2(point.x - 102, 53 - point.y) / (2 * Math.PI);
    return { ...point, phase: (turn + 1) % 1 };
  });
</script>

<MotionArtwork variant="radar">
  <svg viewBox="0 0 204 106" focusable="false">
    <defs>
      <linearGradient id={uid + '-sweep'} x2="1" y2="0">
        <stop stop-color="var(--art-line)" stop-opacity="0" />
        <stop offset="1" stop-color="var(--art-line)" stop-opacity=".62" />
      </linearGradient>
    </defs>
    <path
      d="M20 53h164m-144-7v14m124-14v14m-111 15h9m80-44h9"
      fill="none"
      stroke="var(--art-grid)"
    />
    <circle cx="102" cy="53" r="43" fill="var(--art-soft)" fill-opacity=".52" />
    <g fill="none" stroke="var(--art-line)" stroke-opacity=".55">
      <circle cx="102" cy="53" r="43" />
      <circle cx="102" cy="53" r="30" />
      <circle cx="102" cy="53" r="16" />
      <path
        d="M102 8v90M57 53h90m-75-30 60 60m0-60L72 83"
        stroke-dasharray="2 4"
      />
    </g>
    <g class="motion-part scan">
      <path
        d="M102 53 75 20a43 43 0 0 1 27-10z"
        fill={'url(#' + uid + '-sweep)'}
      />
      <path
        d="M102 53V10"
        stroke="var(--art-ink)"
        stroke-opacity=".66"
        stroke-width="1.2"
      />
    </g>
    {#each echoes as point (point.x)}
      <g class="motion-part echo" style:--echo-phase={point.phase}>
        <circle
          cx={point.x}
          cy={point.y}
          r="4.7"
          fill="none"
          stroke="var(--art-line)"
        />
        <circle cx={point.x} cy={point.y} r="1.9" fill="var(--art-ink)" />
      </g>
    {/each}
    <circle cx="102" cy="53" r="1.7" fill="var(--art-ink)" />
  </svg>
</MotionArtwork>

<style>
  .scan {
    transform-origin: 102px 53px;
    animation: scan calc(12s / var(--art-speed)) linear infinite;
  }
  .echo {
    opacity: 0.55;
    animation: echo calc(12s / var(--art-speed)) linear infinite;
    animation-delay: calc((var(--echo-phase) - 1) * 12s / var(--art-speed));
  }
  @keyframes scan {
    to {
      transform: rotate(1turn);
    }
  }
  @keyframes echo {
    0%,
    100% {
      opacity: 0.13;
    }
    4% {
      opacity: 0.93;
    }
    31% {
      opacity: 0.18;
    }
    56% {
      opacity: 0.1;
    }
  }
</style>
