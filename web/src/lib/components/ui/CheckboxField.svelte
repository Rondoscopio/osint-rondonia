<script lang="ts">
  import { Checkbox, Label } from 'bits-ui';

  let {
    id,
    label,
    checked = $bindable(false),
    className = '',
    disabled = false,
    onCheckedChange = () => {},
  }: {
    id: string;
    label: string;
    checked?: boolean;
    className?: string;
    disabled?: boolean;
    onCheckedChange?: (checked: boolean) => void;
  } = $props();

  function setChecked(next: boolean) {
    checked = next;
    onCheckedChange(next);
  }
</script>

<div class="ui-checkbox-field check {className}">
  <Checkbox.Root
    {id}
    {checked}
    {disabled}
    onCheckedChange={setChecked}
    class="ui-checkbox-root"
    aria-labelledby="{id}-label"
  >
    {#if checked}
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m3 8 3.2 3.2L13 4.5" />
      </svg>
    {/if}
  </Checkbox.Root>
  <Label.Root id="{id}-label" for={id} class="ui-checkbox-label">
    {label}
  </Label.Root>
</div>
