import { onMounted, onUnmounted, type Ref } from 'vue'

interface UseReelKeyboardOptions {
  isEditing: Ref<number | null>
  activeIndex: Ref<number>
  displayedCount: Ref<number>
  loadedClips: Ref<number>
  resultsLength: Ref<number>
  toggleVideoAtIndex: (index: number) => boolean
  loadMore: () => void
}

export function useReelKeyboard(options: UseReelKeyboardOptions) {
  const {
    isEditing, activeIndex, displayedCount, loadedClips,
    resultsLength, toggleVideoAtIndex, loadMore
  } = options

  const _handleKey = (event: KeyboardEvent): void => {
    const tag = (event.target as HTMLElement)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return
    if (isEditing.value !== null) return
    if (event.key !== ' ' && event.key !== 'Enter') return

    event.preventDefault()

    if (activeIndex.value === displayedCount.value && loadedClips.value < resultsLength.value) {
      loadMore()
      return
    }

    if (event.key === ' ' && activeIndex.value < displayedCount.value) {
      toggleVideoAtIndex(activeIndex.value)
    }
  }

  onMounted(() => window.addEventListener('keydown', _handleKey))
  onUnmounted(() => window.removeEventListener('keydown', _handleKey))
}
