<script lang="ts">
  import { Button } from 'bits-ui';
  import { asset, resolve } from '$app/paths';
  import type { Snippet } from 'svelte';

  type BuildInfo = {
    commit?: string;
    commitUrl?: string;
    runNumber?: string;
    runUrl?: string;
  };
  let {
    children,
    buildInfo,
    motionPaused,
    theme,
    databaseUrl,
    toggleMotion,
    toggleTheme,
  }: {
    children: Snippet;
    buildInfo: BuildInfo;
    motionPaused: boolean;
    theme: 'light' | 'dark';
    databaseUrl: string;
    toggleMotion: () => void;
    toggleTheme: () => void;
  } = $props();
</script>

<a class="skip" href="#conteudo">Ir para o conteúdo</a>
<header class="site-header">
  <div class="topbar">
    <a
      class="brand"
      href={resolve('/')}
      aria-label="Rondoscópio — OSINT Rondônia, início"
    >
      <img src={asset('/favicon.svg')} alt="" width="38" height="38" />
      <span class="brand-copy">
        <strong>Rondoscópio</strong>
        <small>OSINT Rondônia</small>
      </span>
    </a>
    <div class="topbar-actions">
      <a
        class="download"
        href={databaseUrl}
        download="catalog.sqlite"
        aria-label="Baixar SQLite"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v3h16v-3" />
        </svg>
        <span>SQLite</span>
      </a>
      <Button.Root
        class="theme-toggle"
        type="button"
        aria-label={theme === 'light'
          ? 'Ativar tema escuro'
          : 'Ativar tema claro'}
        title={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
        onclick={toggleTheme}
      >
        {#if theme === 'light'}
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M20.9 13A8.9 8.9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />
          </svg>
        {:else}
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path
              d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
            />
          </svg>
        {/if}
      </Button.Root>
    </div>
  </div>
</header>

<div class="site-body">
  <main id="conteudo" class="main-area" tabindex="-1">
    <noscript>
      <p class="notice">
        Ative o JavaScript para explorar o catálogo ou baixe o SQLite no
        cabeçalho.
      </p>
    </noscript>
    {@render children()}
  </main>
  <footer class="site-footer">
    <span>Rondoscópio · OSINT Rondônia</span>
    <div class="build-meta" aria-label="Identificação da compilação">
      {#if buildInfo.commit && buildInfo.commitUrl}
        <a href={buildInfo.commitUrl} target="_blank" rel="noopener noreferrer">
          Commit {buildInfo.commit}
        </a>
      {/if}
      {#if buildInfo.runNumber && buildInfo.runUrl}
        <a href={buildInfo.runUrl} target="_blank" rel="noopener noreferrer">
          Build #{buildInfo.runNumber}
        </a>
      {:else}
        <span>Build local</span>
      {/if}
    </div>
    <Button.Root
      type="button"
      class="motion-preference"
      aria-pressed={motionPaused}
      onclick={toggleMotion}
    >
      Pausar ilustrações
    </Button.Root>
    <nav aria-label="Informações do projeto">
      <a href={resolve('/sobre/')}>Sobre</a>
      <a href={resolve('/legal/')}>Legal</a>
      <a href={resolve('/creditos/')}>Créditos</a>
      <a href="https://github.com/Rondoscopio/osint-rondonia" rel="noreferrer">
        Código e dados ↗
      </a>
    </nav>
  </footer>
</div>
