<script lang="ts">
  import { resolve } from '$app/paths';
  let { text }: { text: string } = $props();
</script>

<section class="notice">
  <p>{text}</p>
  <a href={resolve('/')}>Voltar ao catálogo</a>
</section>
