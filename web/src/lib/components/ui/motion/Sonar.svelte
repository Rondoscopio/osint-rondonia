<script lang="ts">
  import MotionArtwork from './MotionArtwork.svelte';
</script>

<MotionArtwork variant="sonar">
  <svg viewBox="0 0 204 106" focusable="false">
    <g fill="none" stroke="var(--art-grid)">
      <path
        d="M16 53h172M57 13v80m90-80v80M25 25h154M25 81h154"
        stroke-dasharray="2 5"
      />
      <circle cx="102" cy="53" r="39" />
      <circle cx="102" cy="53" r="27" />
      <circle cx="102" cy="53" r="15" />
    </g>
    <g fill="none" stroke="var(--art-line)">
      <circle class="motion-part pulse" cx="102" cy="53" r="37" />
      <circle class="motion-part pulse after" cx="102" cy="53" r="37" />
      <path d="M39 70h20l13-9m60-26 12-9h20" />
    </g>
    <circle cx="102" cy="53" r="4" fill="var(--art-ink)" />
    <circle cx="72" cy="61" r="2.3" fill="var(--art-line)" />
    <circle
      class="motion-part reply"
      cx="132"
      cy="35"
      r="2.8"
      fill="var(--art-ink)"
    />
  </svg>
</MotionArtwork>

<style>
  .pulse {
    transform-origin: 102px 53px;
    transform: scale(0.55);
    opacity: 0.55;
    animation: expand calc(10s / var(--art-speed)) ease-out infinite;
    animation-delay: -2s;
  }
  .after {
    animation-delay: -6s;
  }
  .reply {
    animation: reply calc(10s / var(--art-speed)) ease-in-out infinite;
  }
  @keyframes expand {
    0% {
      transform: scale(0.13);
      opacity: 0.76;
    }
    70%,
    100% {
      transform: scale(1.08);
      opacity: 0;
    }
  }
  @keyframes reply {
    0%,
    29%,
    100% {
      opacity: 0.36;
    }
    48% {
      opacity: 1;
    }
    64% {
      opacity: 0.49;
    }
  }
</style>
