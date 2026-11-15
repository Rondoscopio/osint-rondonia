<script lang="ts">
  import type { Snippet } from 'svelte';

  let { children, artwork }: { children: Snippet; artwork: Snippet } = $props();
</script>

<div class="instrument-heading">
  <div class="heading-copy">
    {@render children()}
  </div>
  <div class="heading-art">
    {@render artwork()}
    <small>Ilustração simulada</small>
  </div>
</div>

<style>
  .instrument-heading {
    display: grid;
    grid-template-columns: minmax(0, 1fr) clamp(8rem, 16vw, 12rem);
    gap: clamp(0.75rem, 2vw, 2rem);
    align-items: center;
  }
  .heading-copy {
    min-width: 0;
  }
  .heading-art {
    align-self: center;
    margin-bottom: 1rem;
    text-align: center;
  }
  small {
    display: block;
    color: var(--muted);
    font-size: 0.68rem;
    letter-spacing: 0.015em;
    line-height: 1.15;
  }
  @media (max-width: 680px) {
    .instrument-heading {
      grid-template-columns: minmax(0, 1fr);
      gap: 0;
    }
    .heading-art {
      justify-self: end;
      width: 6.5rem;
      margin-block: -0.6rem 0.8rem;
    }
  }
</style>
