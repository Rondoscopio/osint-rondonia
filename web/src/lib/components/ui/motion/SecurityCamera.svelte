<script lang="ts">
  import MotionArtwork from './MotionArtwork.svelte';
</script>

<MotionArtwork variant="camera">
  <svg viewBox="0 0 204 106" focusable="false">
    <g fill="none" stroke="var(--art-grid)">
      <path
        d="M11 89h182M25 77h148M62 13v77m56-77v77m51-77v77"
        stroke-dasharray="2 5"
      />
      <path d="M20 32h8m-4-4v8m156 28h8m-4-4v8" />
    </g>
    <path
      d="M24 51h14v39H24zM38 76h27l22-17"
      fill="var(--art-soft)"
      stroke="var(--art-line)"
      stroke-width="2"
      stroke-linejoin="round"
    />
    <path
      d="M39 81h27l25-17"
      fill="none"
      stroke="var(--art-line)"
      stroke-width="2"
    />
    <circle
      cx="91"
      cy="58"
      r="9"
      fill="var(--surface)"
      stroke="var(--art-line)"
      stroke-width="2"
    />
    <g class="motion-part camera-head">
      <path
        d="M54 30 137 20l31 15-5 24-81 9-26-14z"
        fill="var(--art-soft)"
        stroke="var(--art-ink)"
        stroke-width="1.5"
        stroke-linejoin="round"
      />
      <path
        d="m52 30 84-12 34 16-83 13z"
        fill="var(--surface)"
        stroke="var(--art-line)"
        stroke-width="1.5"
        stroke-linejoin="round"
      />
      <path d="m138 38 29-4-4 25-29 4z" fill="var(--art-ink)" />
      <ellipse
        cx="150"
        cy="49"
        rx="8"
        ry="8.5"
        fill="var(--surface-alt)"
        stroke="var(--art-line)"
        stroke-width="1.5"
      />
      <ellipse cx="150" cy="49" rx="4.4" ry="5" fill="var(--art-ink)" />
      <circle
        class="motion-part lens"
        cx="152"
        cy="47"
        r="1.5"
        fill="var(--art-light)"
      />
      <path
        d="m72 47 8 5m-7 0 8 5m7-8 35-4m-34 9 23-3"
        fill="none"
        stroke="var(--art-line)"
        stroke-linecap="round"
      />
      <circle cx="124" cy="53" r="1.4" fill="var(--art-ink)" />
    </g>
    <circle cx="91" cy="58" r="3" fill="var(--art-line)" />
  </svg>
</MotionArtwork>

<style>
  .camera-head {
    transform-origin: 91px 58px;
    animation: pan calc(20s / var(--art-speed)) ease-in-out infinite;
  }
  .lens {
    animation: lens calc(20s / var(--art-speed)) ease-in-out infinite;
  }
  @keyframes pan {
    0%,
    18%,
    100% {
      transform: rotate(-5deg);
    }
    39%,
    62% {
      transform: rotate(9deg);
    }
    79%,
    87% {
      transform: rotate(1deg);
    }
  }
  @keyframes lens {
    0%,
    100% {
      opacity: 0.6;
    }
    40%,
    63% {
      opacity: 0.95;
    }
  }
</style>
