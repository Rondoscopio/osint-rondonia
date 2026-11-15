<script lang="ts">
  import MotionArtwork from './MotionArtwork.svelte';
  const uid = $props.id();
</script>

<MotionArtwork variant="thermal">
  <svg viewBox="0 0 204 106" focusable="false">
    <defs>
      <radialGradient id={uid + '-warm'}>
        <stop stop-color="#ecb960" stop-opacity=".95" />
        <stop offset=".32" stop-color="#9cbd73" stop-opacity=".88" />
        <stop offset=".67" stop-color="#4c907b" stop-opacity=".58" />
        <stop offset="1" stop-color="#2b716c" stop-opacity="0" />
      </radialGradient>
      <radialGradient id={uid + '-cool'}>
        <stop stop-color="#54a9a6" stop-opacity=".72" />
        <stop offset=".65" stop-color="#53768c" stop-opacity=".43" />
        <stop offset="1" stop-color="#53768c" stop-opacity="0" />
      </radialGradient>
      <linearGradient id={uid + '-scale'}>
        <stop stop-color="#53768c" />
        <stop offset=".45" stop-color="#4e9f8d" />
        <stop offset=".75" stop-color="#9cbd73" />
        <stop offset="1" stop-color="#ecb960" />
      </linearGradient>
      <clipPath id={uid + '-bounds'}>
        <rect x="19" y="13" width="166" height="73" rx="5" />
      </clipPath>
    </defs>
    <rect x="19" y="13" width="166" height="73" rx="5" fill="var(--art-soft)" />
    <g clip-path={'url(#' + uid + '-bounds)'}>
      <ellipse
        class="motion-part cool"
        cx="143"
        cy="57"
        rx="54"
        ry="39"
        fill={'url(#' + uid + '-cool)'}
      />
      <g class="motion-part warm">
        <ellipse
          cx="84"
          cy="45"
          rx="60"
          ry="38"
          fill={'url(#' + uid + '-warm)'}
        />
        <g
          fill="none"
          stroke="var(--art-ink)"
          stroke-opacity=".33"
          stroke-width=".9"
        >
          <path
            d="M40 50c0-15 15-24 33-26 19-3 30 2 41 10 9 6 17 19 5 26-11 8-27 6-43 8-18 0-37-5-36-18z"
          />
          <path
            d="M54 48c2-10 14-16 27-17 16-2 26 5 30 13 6 13-15 16-30 16-13 0-28-2-27-12z"
          />
          <path d="M68 47c2-8 18-13 27-7 9 6-5 13-15 13-9 0-13-2-12-6z" />
        </g>
      </g>
      <path
        d="M19 37h166M19 62h166M61 13v73m41-73v73m41-73v73"
        stroke="var(--art-grid)"
      />
    </g>
    <rect
      x="109"
      y="93"
      width="76"
      height="3"
      rx="1.5"
      fill={'url(#' + uid + '-scale)'}
    />
    <path d="M20 95h14m6 0h8" stroke="var(--art-line)" stroke-opacity=".6" />
  </svg>
</MotionArtwork>

<style>
  .warm {
    transform-origin: 84px 45px;
    animation: diffuse calc(22s / var(--art-speed)) ease-in-out infinite;
  }
  .cool {
    transform-origin: 143px 57px;
    animation: diffuse calc(28s / var(--art-speed)) ease-in-out infinite reverse;
  }
  @keyframes diffuse {
    0%,
    100% {
      transform: translateX(0) scale(0.97);
      opacity: 0.92;
    }
    53% {
      transform: translateX(10px) scale(1.08);
      opacity: 0.76;
    }
  }
</style>
