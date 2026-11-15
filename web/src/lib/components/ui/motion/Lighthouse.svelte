<script lang="ts">
  import MotionArtwork from './MotionArtwork.svelte';

  let { paused = false }: { paused?: boolean } = $props();
  const uid = $props.id();
</script>

<MotionArtwork variant="lighthouse" {paused}>
  <svg viewBox="0 0 520 340" focusable="false">
    <defs>
      <linearGradient id={uid + '-beam'} x1="1" x2="0" y1="0" y2="0">
        <stop stop-color="#f5ffcb" stop-opacity=".78" />
        <stop offset=".35" stop-color="#d5fca3" stop-opacity=".3" />
        <stop offset="1" stop-color="#b4ef76" stop-opacity="0" />
      </linearGradient>
      <linearGradient id={uid + '-tower'} x1="1" x2="0" y1="0" y2="0">
        <stop stop-color="#cde3c1" />
        <stop offset=".44" stop-color="#edfad7" />
        <stop offset=".45" stop-color="#a1c8a5" />
        <stop offset="1" stop-color="#76a98a" />
      </linearGradient>
      <linearGradient id={uid + '-sea'} x2="0" y2="1">
        <stop stop-color="#254e41" />
        <stop offset="1" stop-color="#14382e" stop-opacity=".25" />
      </linearGradient>
      <radialGradient id={uid + '-halo'}>
        <stop stop-color="#d7ffa1" stop-opacity=".23" />
        <stop offset="1" stop-color="#d7ffa1" stop-opacity="0" />
      </radialGradient>
      <radialGradient id={uid + '-mask-light'} cx=".46" cy=".44" r=".64">
        <stop stop-color="white" />
        <stop offset=".73" stop-color="white" />
        <stop offset="1" stop-color="black" />
      </radialGradient>
      <mask id={uid + '-mask'}>
        <rect width="520" height="340" fill={'url(#' + uid + '-mask-light)'} />
      </mask>
      <clipPath id={uid + '-tower-clip'}>
        <path d="M306 252 317 127h42l12 125z" />
      </clipPath>
    </defs>

    <g mask={'url(#' + uid + '-mask)'}>
      <circle cx="339" cy="100" r="128" fill={'url(#' + uid + '-halo)'} />
      <g fill="none" stroke="#a9d3a8" stroke-opacity=".2" stroke-width="1">
        <path
          d="M32 228h458M337 24v261M87 205h350M113 179h290"
          stroke-dasharray="2 7"
        />
        <path d="M198 162a150 150 0 0 1 282-21M230 144a119 119 0 0 1 221-17" />
        <path
          d="M209 137l-5-4m25-26-4-5m32-18-2-6m34-12-1-6m43 0v-6m40 11 2-6m35 21 3-6m27 30 5-5"
        />
        <path d="M52 165h14m-7-7v14m391 21h14m-7-7v14M153 99h8m-4-4v8" />
      </g>

      <g class="motion-part beam">
        <path
          d="M337 97 44 4Q16 99 45 187L337 105z"
          fill={'url(#' + uid + '-beam)'}
          transform="translate(674 0) scale(-1 1)"
        />
      </g>
      <g fill="#d7ffa1">
        <circle class="motion-part fleck" cx="208" cy="102" r="2" />
        <circle class="motion-part fleck second" cx="152" cy="125" r="1.5" />
        <circle cx="431" cy="146" r="1.6" opacity=".48" />
      </g>

      <path d="M25 260h480v65H25z" fill={'url(#' + uid + '-sea)'} />
      <path
        d="M17 264c56-8 104-9 169-7l42-18 46 3 35-16h66l35 17 43 4 53 15v14H17z"
        fill="#2d5b46"
      />
      <path
        d="m134 268 81-13 54 2 37-20h71l31 16 51 6"
        fill="none"
        stroke="#b4cc9e"
        stroke-opacity=".55"
      />
      <g
        class="motion-part reflections"
        fill="none"
        stroke="#d6eea6"
        stroke-width="1.5"
        stroke-linecap="round"
      >
        <path d="M228 282h35m34 0h49m33 0h10m-142 10h62m19 0h31m-68 10h37" />
      </g>
      <path
        d="M165 280h38m202 6h39m-282 14h51m152 9h36m-186 5h31"
        fill="none"
        stroke="#94b99a"
        stroke-opacity=".48"
        stroke-linecap="round"
      />

      <path
        d="M306 252 317 127h42l12 125z"
        fill={'url(#' + uid + '-tower)'}
        stroke="#163f31"
        stroke-width="1.5"
      />
      <g clip-path={'url(#' + uid + '-tower-clip)'}>
        <path
          d="M303 148h74v16h-74zm0 42h74v15h-74z"
          fill="#4a8068"
          opacity=".78"
        />
        <path
          d="M308 166h59m-59 42h59m-59 8h59m-59 8h59m-59 8h59"
          fill="none"
          stroke="#245742"
          stroke-opacity=".39"
        />
        <path
          d="M323 166v41m-2 5v17m29-65v46m0 7v18"
          fill="none"
          stroke="#f5ffdb"
          stroke-opacity=".45"
        />
      </g>
      <path
        d="M331 252v-17a6 6 0 0 1 12 0v17zm2-71v-9a4 4 0 0 1 8 0v9z"
        fill="#194638"
      />
      <path
        d="M300 252h75l8 7h-90z"
        fill="#b4c69e"
        stroke="#245442"
        stroke-width="1.5"
      />
      <path
        d="M307 115h62l-6 14h-50z"
        fill="#81a58a"
        stroke="#15392d"
        stroke-width="2"
      />
      <path
        d="M304 108h69v9h-69zm7 0v-6m9 6v-6m38 6v-6m8 6v-6"
        fill="none"
        stroke="#c4ddae"
        stroke-width="1.5"
      />

      <path
        d="M323 85h31v23h-31z"
        fill="#a8bc72"
        stroke="#173c2d"
        stroke-width="2"
      />
      <path class="motion-part lantern" d="M326 88h25v17h-25z" fill="#f3ffc4" />
      <path
        d="M330 87v19m8-19v19m9-19v19"
        stroke="#446947"
        stroke-width="1.5"
      />
      <path
        d="M319 86q3-13 19-16 15 2 20 16z"
        fill="#3e6e52"
        stroke="#c5dfa8"
        stroke-width="1.4"
      />
      <path
        d="M338 69v-7m-5 0h10"
        stroke="#c5dfa8"
        stroke-width="1.5"
        stroke-linecap="round"
      />
    </g>
  </svg>
</MotionArtwork>

<style>
  .beam {
    transform-origin: 337px 101px;
    transform: scaleX(-0.93) rotate(-4deg);
    opacity: 0.86;
    animation: sweep calc(24s / var(--art-speed)) ease-in-out infinite;
  }
  .lantern {
    animation: lantern calc(24s / var(--art-speed)) ease-in-out infinite;
  }
  .fleck {
    opacity: 0.45;
    animation: glint calc(12s / var(--art-speed)) ease-in-out infinite;
  }
  .second {
    animation-delay: -5s;
  }
  .reflections {
    opacity: 0.47;
    animation: glint calc(17s / var(--art-speed)) ease-in-out infinite;
  }
  @keyframes sweep {
    0%,
    100% {
      transform: scaleX(-0.93) rotate(-4deg);
      opacity: 0.86;
    }
    24% {
      transform: scaleX(-0.68) rotate(8deg);
      opacity: 0.55;
    }
    40% {
      transform: scaleX(0.03) rotate(2deg);
      opacity: 0.1;
    }
    62% {
      transform: scaleX(0.82) rotate(-9deg);
      opacity: 0.82;
    }
    84% {
      transform: scaleX(-0.14) rotate(-2deg);
      opacity: 0.12;
    }
  }
  @keyframes lantern {
    0%,
    100% {
      opacity: 0.85;
    }
    40%,
    84% {
      opacity: 0.48;
    }
    60% {
      opacity: 1;
    }
  }
  @keyframes glint {
    0%,
    100% {
      opacity: 0.46;
    }
    50% {
      opacity: 0.16;
    }
  }
</style>
