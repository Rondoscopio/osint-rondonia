<script lang="ts">
  import { Button } from 'bits-ui';
  import { resolve } from '$app/paths';
  import InstrumentHeading from '$lib/components/ui/motion/InstrumentHeading.svelte';
  import Lighthouse from '$lib/components/ui/motion/Lighthouse.svelte';
  let {
    eyebrow,
    heading,
    lead,
  }: { eyebrow: string; heading: string; lead: string } = $props();
</script>

{#snippet intro()}
  <div class="page-heading">
    <p class="eyebrow">{eyebrow}</p>
    <h1>{heading}</h1>
    <p>{lead}</p>
  </div>
{/snippet}
<InstrumentHeading>
  {#snippet artwork()}<Lighthouse />{/snippet}
  {@render intro()}
</InstrumentHeading>

<div class="info-grid">
  <section class="card panel">
    <h2>O que você encontra</h2>
    <p>
      Fichas para serviços e bases públicas, ferramentas, documentos e
      diretórios. Cada ficha pode reunir endereço, descrição, categorias,
      abrangência e proveniência, conforme os dados disponíveis.
    </p>
    <p>
      Use a <a href={resolve('/fontes/')}>busca de fontes</a>
      para combinar texto, categoria, tipo, triagem e território.
    </p>
  </section>

  <section class="card panel">
    <h2>Como interpretar</h2>
    <p>
      A presença no catálogo não significa que um endereço esteja disponível,
      que a ferramenta tenha sido testada ou que uma fonte endosse o
      Rondoscópio. Parte das fichas aguarda triagem editorial.
    </p>
    <p>
      Categorias e abrangências descrevem os registros catalogados. Elas não
      atestam precisão, independência editorial, atualidade ou qualidade dos
      dados da fonte externa.
    </p>
  </section>

  <section class="card panel">
    <h2>Dados abertos e navegação</h2>
    <p>
      O catálogo está disponível em CSV e SQLite. A interface baixa o SQLite do
      próprio site e consulta os dados no navegador; filtros podem ser
      compartilhados pela URL.
    </p>
    <Button.Root
      class="button primary"
      href="https://github.com/Rondoscopio/osint-rondonia/issues"
    >
      Propor correção ou melhoria ↗
    </Button.Root>
  </section>
</div>
