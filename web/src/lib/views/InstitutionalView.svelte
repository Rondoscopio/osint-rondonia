<script lang="ts">
  import PageMeta from '$lib/components/ui/PageMeta.svelte';
  import SobreContent from '$lib/components/features/institutional/SobreContent.svelte';
  import LegalContent from '$lib/components/features/institutional/LegalContent.svelte';
  import CreditosContent from '$lib/components/features/institutional/CreditosContent.svelte';
  import {
    createInstitutionalViewModel,
    type InstitutionalPage,
  } from '$lib/features/institutional/institutional.viewmodel';

  let { page }: { page: InstitutionalPage } = $props();
  const details = $derived(createInstitutionalViewModel(page));
  const Content = $derived(
    { sobre: SobreContent, legal: LegalContent, creditos: CreditosContent }[
      page
    ],
  );
</script>

<PageMeta title={details.title} description={details.description} />
<Content
  eyebrow={details.eyebrow}
  heading={details.heading}
  lead={details.lead}
/>
