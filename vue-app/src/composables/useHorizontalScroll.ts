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
  const navigationLock = ref(false)

  const handleWheel = (event: WheelEvent) => {
    if (!containerRef.value) return

    if (Math.abs(event.deltaY) > 0) {
      event.preventDefault()
      containerRef.value.scrollLeft += event.deltaY
    }

    if (scrollTimeout.value) {
      clearTimeout(scrollTimeout.value)
    }

    scrollTimeout.value = window.setTimeout(() => {
      updateActiveFromScroll()
    }, 150)
  }

  const handleScroll = () => {
    if (isManualScroll.value || navigationLock.value) return

    if (scrollTimeout.value) {
      clearTimeout(scrollTimeout.value)
    }

    scrollTimeout.value = window.setTimeout(() => {
      if (!isManualScroll.value && !navigationLock.value) {
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
    console.log('Key pressed:', e.key, 'Target:', e.target)

    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      e.stopPropagation()
      const newIndex = Math.max(0, activeIndex.value - 1)
      console.log('Arrow Left - changing from', activeIndex.value, 'to', newIndex, 'totalItems:', totalItems.value)
      scrollToItem(newIndex)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      e.stopPropagation()
      if (activeIndex.value >= totalItems.value - 1) {
        console.log('Arrow Right - already at last valid item')
        return
      }
      const newIndex = Math.min(totalItems.value - 1, activeIndex.value + 1)
      console.log('Arrow Right - changing from', activeIndex.value, 'to', newIndex, 'totalItems:', totalItems.value)
      scrollToItem(newIndex)
    }
  }

  const scrollToItem = (index: number) => {
    if (!containerRef.value) return

    if (scrollTimeout.value) {
      clearTimeout(scrollTimeout.value)
    }

    navigationLock.value = true
    isManualScroll.value = true
    activeIndex.value = index
    console.log('scrollToItem - activeIndex set to:', index)

    const items = containerRef.value.querySelectorAll(itemSelector)
    const targetItem = items[index] as HTMLElement

    if (targetItem) {
      const containerRect = containerRef.value.getBoundingClientRect()
      const itemRect = targetItem.getBoundingClientRect()
      const scrollLeft = containerRef.value.scrollLeft + (itemRect.left - containerRect.left) - (containerRect.width - itemRect.width) / 2

      containerRef.value.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      })

      scrollTimeout.value = window.setTimeout(() => {
        navigationLock.value = false
        isManualScroll.value = false
        console.log('navigationLock released, activeIndex:', activeIndex.value)
      }, 1500)
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
    if (!containerRef.value) {
      console.warn('setupScrollListeners - containerRef is null!')
      return
    }

    console.log('setupScrollListeners - adding event listeners')
    containerRef.value.addEventListener('wheel', handleWheel, { passive: false })
    containerRef.value.addEventListener('scroll', handleScroll)
    document.addEventListener('keydown', handleKeyDown)
    console.log('setupScrollListeners - keydown listener added to document')
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
    navigationLock,
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
