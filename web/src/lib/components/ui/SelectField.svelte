<script lang="ts">
  import { Select } from 'bits-ui';

  export type SelectOption = {
    value: string;
    label: string;
    disabled?: boolean;
  };

  let {
    id,
    label,
    options,
    value = $bindable(''),
    placeholder = 'Selecione uma opção',
    ariaLabel,
    className = '',
    disabled = false,
    onValueChange = () => {},
  }: {
    id: string;
    label?: string;
    options: SelectOption[];
    value?: string;
    placeholder?: string;
    ariaLabel?: string;
    className?: string;
    disabled?: boolean;
    onValueChange?: (value: string) => void;
  } = $props();

  const emptyOption = '__select_field_empty_option__';
  const selectedLabel = $derived(
    options.find((option) => option.value === value)?.label ?? placeholder,
  );

  function setValue(next: string) {
    value = next === emptyOption ? '' : next;
    onValueChange(value);
  }
</script>

<div class="ui-select-field {className}">
  {#if label}<span id="{id}-label" class="ui-select-label">{label}</span>{/if}
  <Select.Root type="single" {value} {disabled} onValueChange={setValue}>
    <Select.Trigger
      {id}
      class="ui-select-trigger"
      aria-label={ariaLabel ?? (!label ? id : undefined)}
      aria-labelledby={label ? `${id}-label` : undefined}
    >
      <span>{selectedLabel}</span>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m5.5 7.5 4.5 4.5 4.5-4.5" />
      </svg>
    </Select.Trigger>
    <Select.Portal>
      <Select.Content class="ui-select-content" sideOffset={4} align="start">
        <Select.Viewport>
          {#each options as option (option.value)}
            <Select.Item
              value={option.value === '' ? emptyOption : option.value}
              label={option.label}
              disabled={option.disabled}
              class="ui-select-item"
            >
              {option.label}
            </Select.Item>
          {/each}
        </Select.Viewport>
      </Select.Content>
    </Select.Portal>
  </Select.Root>
</div>
