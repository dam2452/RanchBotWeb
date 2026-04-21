<script setup lang="ts">
import { computed } from 'vue'
import { useWindowWidth } from '@/composables/useWindowWidth'
import LoginFormWatch from './LoginFormWatch.vue'
import LoginFormBench from './LoginFormBench.vue'

interface Props {
  loading?: boolean
  error?: string
}

interface Emits {
  (e: 'submit', data: { login: string; password: string }): void
}

defineProps<Props>()
defineEmits<Emits>()

const { windowWidth } = useWindowWidth()
const isWatchView = computed(() => windowWidth.value <= 196)
</script>

<template>
  <LoginFormWatch v-if="isWatchView" :loading="loading" :error="error" @submit="$emit('submit', $event)" />
  <LoginFormBench v-else :loading="loading" :error="error" @submit="$emit('submit', $event)" />
</template>
