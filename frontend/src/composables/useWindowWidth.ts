import { ref, onMounted, onUnmounted } from 'vue'

export function useWindowWidth() {
  const windowWidth = ref(window.innerWidth)
  const windowHeight = ref(window.innerHeight)

  const _update = (): void => {
    windowWidth.value = window.innerWidth
    windowHeight.value = window.innerHeight
  }

  onMounted(() => window.addEventListener('resize', _update))
  onUnmounted(() => window.removeEventListener('resize', _update))

  return { windowWidth, windowHeight }
}
