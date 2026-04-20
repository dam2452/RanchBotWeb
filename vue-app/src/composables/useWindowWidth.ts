import { ref, onMounted, onUnmounted } from 'vue'

export function useWindowWidth() {
  const windowWidth = ref(window.innerWidth)
  const _update = (): void => { windowWidth.value = window.innerWidth }

  onMounted(() => window.addEventListener('resize', _update))
  onUnmounted(() => window.removeEventListener('resize', _update))

  return { windowWidth }
}
