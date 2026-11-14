<script setup lang="ts">
import { PROVIDERS, type ProviderId } from '@/domain/migration'

defineProps<{ label: string; modelValue: ProviderId | null; disabled?: ProviderId | null }>()
const emit = defineEmits<{ 'update:modelValue': [id: ProviderId] }>()
</script>

<template>
  <fieldset class="space-y-2">
    <legend class="mb-2 font-mono text-xs tracking-widest text-muted uppercase">{{ label }}</legend>
    <label
      v-for="p in PROVIDERS"
      :key="p.id"
      class="flex cursor-pointer items-center gap-3 rounded-xl border bg-raised px-4 py-3"
      :class="[
        modelValue === p.id ? 'border-primary' : 'border-border',
        disabled === p.id ? 'cursor-not-allowed opacity-40' : '',
      ]"
    >
      <input
        type="radio"
        class="accent-primary"
        :name="label"
        :value="p.id"
        :checked="modelValue === p.id"
        :disabled="disabled === p.id"
        @change="emit('update:modelValue', p.id)"
      />
      <span class="grid size-8 place-items-center rounded-full bg-border text-sm">
        {{ p.name[0] }}
      </span>
      <span class="flex-1">
        <span class="block text-sm font-medium">{{ p.name }}</span>
        <span class="block text-xs text-muted">{{ p.hint }}</span>
      </span>
    </label>
  </fieldset>
</template>