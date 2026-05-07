import { ref, type Ref } from 'vue'
import { useRubberBand } from './scroll/useRubberBand'
import { useScrollTracker } from './scroll/useScrollTracker'
import { useScrollKeyboard } from './scroll/useScrollKeyboard'

interface UseHorizontalScrollOptions {
  containerRef: Ref<HTMLElement | null>
  activeIndex: Ref<number>
  totalItems: Ref<number>
  itemSelector?: string
  isLastItem?: (index: number) => boolean
  isEditing?: () => boolean
  enableKeyboard?: boolean
}

export function useHorizontalScroll(options: UseHorizontalScrollOptions) {
  const {
    containerRef, activeIndex, totalItems,
    itemSelector = '.scroll-item',
    isLastItem, isEditing,
    enableKeyboard = true
  } = options

  const rubberBand = useRubberBand({ activeIndex, totalItems, isEditing })
  const tracker = useScrollTracker({ containerRef, activeIndex, totalItems, itemSelector, isEditing })
  const keyboard = useScrollKeyboard({ activeIndex, totalItems, scrollToItem: tracker.scrollToItem, isEditing })

  const scrollToItem = (index: number): void => {
    tracker.scrollToItem(index, isLastItem)
  }

  const setupScrollListeners = (): void => {
    if (!containerRef.value) return
    const el = containerRef.value
    el.addEventListener('wheel', tracker.handleWheel, { passive: false })
    el.addEventListener('scroll', tracker.handleScroll)
    el.addEventListener('touchstart', rubberBand.handleTouchStart, { passive: true })
    el.addEventListener('touchmove', rubberBand.handleTouchMove, { passive: false })
    el.addEventListener('touchend', rubberBand.handleTouchEnd, { passive: true })
    if (enableKeyboard) {
      document.addEventListener('keydown', keyboard.handleKeyDown)
    }
  }

  const cleanupScrollListeners = (): void => {
    if (containerRef.value) {
      const el = containerRef.value
      el.removeEventListener('wheel', tracker.handleWheel)
      el.removeEventListener('scroll', tracker.handleScroll)
      el.removeEventListener('touchstart', rubberBand.handleTouchStart)
      el.removeEventListener('touchmove', rubberBand.handleTouchMove)
      el.removeEventListener('touchend', rubberBand.handleTouchEnd)
    }
    if (enableKeyboard) {
      document.removeEventListener('keydown', keyboard.handleKeyDown)
    }
  }

  return {
    scrollTimeout: tracker.scrollTimeout,
    isManualScroll: tracker.isManualScroll,
    scrollToItem,
    setupScrollListeners,
    cleanupScrollListeners,
    bounceOffset: rubberBand.bounceOffset,
    isBouncing: rubberBand.isBouncing
  }
}
