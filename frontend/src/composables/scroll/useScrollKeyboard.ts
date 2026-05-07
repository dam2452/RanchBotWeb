import type { Ref } from 'vue'

interface UseScrollKeyboardOptions {
  activeIndex: Ref<number>
  totalItems: Ref<number>
  scrollToItem: (index: number) => void
  isEditing?: () => boolean
}

export function useScrollKeyboard(options: UseScrollKeyboardOptions) {
  const { activeIndex, totalItems, scrollToItem, isEditing } = options

  const handleKeyDown = (e: KeyboardEvent): void => {
    if (isEditing && isEditing()) return

    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      e.stopPropagation()
      scrollToItem(Math.max(0, activeIndex.value - 1))
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      e.stopPropagation()
      if (activeIndex.value < totalItems.value - 1) {
        scrollToItem(Math.min(totalItems.value - 1, activeIndex.value + 1))
      }
    }
  }

  return { handleKeyDown }
}
