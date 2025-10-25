import { ref, type Ref } from 'vue'

interface UseHorizontalScrollOptions {
  containerRef: Ref<HTMLElement | null>
  activeIndex: Ref<number>
  totalItems: Ref<number>
  itemSelector?: string
}

export function useHorizontalScroll(options: UseHorizontalScrollOptions) {
  const { containerRef, activeIndex, totalItems, itemSelector = '.scroll-item' } = options

  const scrollTimeout = ref<number | null>(null)
  const isManualScroll = ref(false)

  const handleWheel = (event: WheelEvent) => {
    if (!containerRef.value) return

    if (Math.abs(event.deltaY) > 0) {
      event.preventDefault()
      containerRef.value.scrollLeft += event.deltaY
    }

    if (scrollTimeout.value) {
      clearTimeout(scrollTimeout.value)
    }

    isManualScroll.value = true

    scrollTimeout.value = window.setTimeout(() => {
      isManualScroll.value = false
      updateActiveFromScroll()
    }, 150)
  }

  const handleScroll = () => {
    if (scrollTimeout.value) {
      clearTimeout(scrollTimeout.value)
    }

    scrollTimeout.value = window.setTimeout(() => {
      if (!isManualScroll.value) {
        updateActiveFromScroll()
      }
    }, 150)
  }

  const updateActiveFromScroll = () => {
    if (!containerRef.value) return

    const container = containerRef.value
    const containerCenter = container.scrollLeft + container.clientWidth / 2
    const items = container.querySelectorAll(itemSelector)

    let closestIndex = 0
    let closestDistance = Infinity

    items.forEach((item, index) => {
      const element = item as HTMLElement
      const itemCenter = element.offsetLeft + element.offsetWidth / 2
      const distance = Math.abs(containerCenter - itemCenter)

      if (distance < closestDistance) {
        closestDistance = distance
        closestIndex = index
      }
    })

    if (closestIndex !== activeIndex.value && closestIndex >= 0 && closestIndex < totalItems.value) {
      activeIndex.value = closestIndex
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      scrollToItem(Math.max(0, activeIndex.value - 1))
    } else if (e.key === 'ArrowRight') {
      scrollToItem(Math.min(totalItems.value - 1, activeIndex.value + 1))
    }
  }

  const scrollToItem = (index: number) => {
    if (!containerRef.value) return

    const items = containerRef.value.querySelectorAll(itemSelector)
    const targetItem = items[index] as HTMLElement

    if (targetItem) {
      targetItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      activeIndex.value = index
    }
  }

  const handleItemClick = (index: number, event?: MouseEvent) => {
    if (event) {
      const target = event.target as HTMLElement
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        return
      }
    }
    scrollToItem(index)
  }

  const setupScrollListeners = () => {
    if (!containerRef.value) return

    containerRef.value.addEventListener('wheel', handleWheel, { passive: false })
    containerRef.value.addEventListener('scroll', handleScroll)
    document.addEventListener('keydown', handleKeyDown)
  }

  const cleanupScrollListeners = () => {
    if (containerRef.value) {
      containerRef.value.removeEventListener('wheel', handleWheel)
      containerRef.value.removeEventListener('scroll', handleScroll)
    }
    document.removeEventListener('keydown', handleKeyDown)
  }

  return {
    scrollTimeout,
    isManualScroll,
    handleWheel,
    handleScroll,
    updateActiveFromScroll,
    handleKeyDown,
    scrollToItem,
    handleItemClick,
    setupScrollListeners,
    cleanupScrollListeners
  }
}
