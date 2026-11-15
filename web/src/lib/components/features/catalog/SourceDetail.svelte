<script lang="ts">
  import type { Detail } from '$lib/features/catalog/domain/types';
  import { httpLink, portalLink, sources, tools } from '$lib/links';
  import { displayLabel, displayText } from '$lib/shared/labels';

  let {
    detail,
    natureza = 'fonte',
    section,
  }: {
    detail: Detail;
    natureza?: 'fonte' | 'ferramenta';
    section?: string;
  } = $props();
  const { fonte, categorias, urls, origens, abrangencias } = $derived(detail);
  const isTool = $derived(natureza === 'ferramenta');
  const relatedRecordLink = (
    id: string,
    relatedNature: 'fonte' | 'ferramenta' | null,
  ) => (relatedNature === 'ferramenta' ? tools : sources)({ id });
  const portalRoleLabel: Record<string, string> = {
    publicador: 'Site publicador',
    orgao_responsavel: 'Órgão responsável',
    entidade_responsavel: 'Entidade responsável',
  };
  const labels: Record<string, string> = {
    id_externo: 'ID externo',
    nota: 'Nota',
    observacao: 'Observação',
    observacoes: 'Observações',
    esfera: 'Esfera',
    tecnologia: 'Tecnologia',
    acesso_declarado: 'Acesso declarado',
    data_referencia: 'Data de referência',
    referencia_institucional: 'Referência institucional',
    repositorio_oficial: 'Repositório oficial',
    licenca_spdx: 'Licença declarada',
  };
</script>

{#if !section || section === 'identity'}
  <div class="page-heading">
    <p class="eyebrow">
      {isTool ? 'Ferramenta' : 'Fonte de dados'}
    </p>
    <h1>{displayText(fonte.nome)}</h1>
    {#if fonte.descricao}<p class="preserve">
        {displayText(fonte.descricao)}
      </p>{/if}
  </div>
  <div class="detail-grid" class:single-detail={section}>
    <section class="card panel">
      <h2>Registro</h2>
      <dl>
        <dt>ID da ficha</dt>
        <dd>{fonte.id}</dd>
        {#if fonte.tipo}<dt>Tipo registrado</dt>
          <dd>{displayText(fonte.tipo)}</dd>{/if}
        <dt>Triagem editorial</dt>
        <dd>
          {fonte.status_triagem
            ? displayText(fonte.status_triagem)
            : 'Sem registro'}
        </dd>
        <dt>Validação</dt>
        <dd>
          {typeof fonte.validacao === 'string'
            ? displayText(fonte.validacao)
            : (fonte.validacao ?? 'Sem registro')}
        </dd>
        <dt>Situação do link</dt>
        <dd>
          {typeof fonte.situacao_url === 'string'
            ? displayText(fonte.situacao_url)
            : (fonte.situacao_url ?? 'Sem registro')}
        </dd>
        {#each Object.entries(labels) as [field, label] (field)}
          {#if fonte[field] !== null && fonte[field] !== undefined && fonte[field] !== ''}
            <dt>{label}</dt>
            <dd class="preserve">
              {#if typeof fonte[field] === 'string'}
                {displayText(fonte[field])}
              {:else}
                {fonte[field]}
              {/if}
            </dd>
          {/if}
        {/each}
      </dl>
    </section>
  </div>
{/if}
<div class="detail-grid" class:single-detail={section}>
  {#if !section || section === 'links'}
    <section class="card panel">
      <h2>Links</h2>
      {#if urls.length}
        <ul class="records">
          {#each urls as entry (entry.id)}
            {@const href = httpLink(entry.url)}
            <li>
              <span class="muted">{displayText(entry.papel)}</span>
              <br />
              {#if href}<a {href} rel="noreferrer">
                  {entry.nome ? displayText(entry.nome) : entry.url} ↗
                </a>
              {:else}{entry.nome ? displayText(entry.nome) : entry.url}{/if}
              {#if entry.nome && entry.nome !== entry.url}<small>
                  {entry.url}
                </small>{/if}
            </li>
          {/each}
        </ul>
      {:else}<p class="muted">Sem links registrados.</p>{/if}
    </section>
  {/if}
  {#if !section || section === 'classifications'}
    <section class="card panel">
      <h2>Categorias</h2>
      {#if categorias.length}
        <ul class="chips">
          {#each categorias as item (item.id)}
            <li>
              <a
                class="pill"
                href={(isTool ? tools : sources)({ categoria: item.id })}
              >
                {displayText(item.nome)} · {displayLabel(
                  item.tipo_classificacao,
                )}
              </a>
            </li>
          {/each}
        </ul>
      {:else}<p class="muted">Sem categorias registradas.</p>{/if}
    </section>
  {/if}
  {#if !section || section === 'publishers'}
    <section class="card panel">
      <h2>Portais e responsáveis</h2>
      {#if detail.portais.length}
        <ul class="records">
          {#each detail.portais as item (`${item.id}:${item.papel}`)}
            <li>
              <span class="muted">
                {portalRoleLabel[item.papel] ?? displayLabel(item.papel)}
              </span>
              <br />
              <a href={portalLink(item.id)}>{displayText(item.nome)}</a>
              {#if item.portal_pai_id && item.portal_pai_nome}
                <small>
                  Vinculado a <a href={portalLink(item.portal_pai_id)}>
                    {displayText(item.portal_pai_nome)}
                  </a>
                </small>
              {/if}
              {#if item.url_base}
                {@const href = httpLink(item.url_base)}
                <small>
                  {#if href}<a {href} rel="noreferrer">
                      {item.url_base} ↗
                    </a>{:else}{item.url_base}{/if}
                </small>
              {/if}
            </li>
          {/each}
        </ul>
      {:else}<p class="muted">
          Nenhum portal ou responsável foi declarado para esta ficha.
        </p>{/if}
    </section>
  {/if}
  {#if !section || section === 'origins'}
    <section class="card panel">
      <h2>Origens</h2>
      {#if origens.length}
        <ul class="records">
          {#each origens as item (item.tipo_origem)}
            <li>
              <span class="muted">{displayLabel(item.tipo_origem)}</span>
              <br />
              {#if item.fonte_id}<a
                  href={relatedRecordLink(item.fonte_id, item.natureza)}
                >
                  {displayText(item.nome ?? item.valor_original)}
                </a>
                <small>{displayText(item.valor_original)}</small>
              {:else}{displayText(item.valor_original)}{/if}
            </li>
          {/each}
        </ul>
      {:else}<p class="muted">Sem origens registradas.</p>{/if}
    </section>
  {/if}
  {#if !section || section === 'coverage'}
    <section class="card panel">
      <h2>Abrangência</h2>
      {#each abrangencias as item (item.papel)}
        <h3>
          {item.papel === 'cobertura' ? 'Cobertura' : 'Localidade declarada'}
        </h3>
        <ul class="chips">
          {#if item.nacional}
            <!-- prettier-ignore -->
            <li>
            <span class="pill">
              Nacional
            </span>
          </li>
          {/if}
          {#if item.internacional}<li>
              <span class="pill">Internacional</span>
            </li>{/if}
          {#each item.ufs as uf (uf.id)}<li>
              <span class="pill">{uf.nome}</span>
            </li>{/each}
          {#each item.municipios as municipality (municipality.id)}<li>
              <span class="pill">{municipality.nome}</span>
            </li>{/each}
        </ul>
      {:else}<p class="muted">Sem abrangência registrada.</p>{/each}
    </section>
  {/if}
</div>

<style>
  .single-detail {
    grid-template-columns: minmax(0, 1fr);
  }
  .single-detail:empty {
    display: none;
  }
</style>
