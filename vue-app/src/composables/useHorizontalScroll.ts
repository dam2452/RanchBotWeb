import { ref, type Ref } from 'vue'

interface UseHorizontalScrollOptions {
  containerRef: Ref<HTMLElement | null>
  activeIndex: Ref<number>
  totalItems: Ref<number>
  itemSelector?: string
  isLastItem?: (index: number) => boolean
  isEditing?: () => boolean
}

export function useHorizontalScroll(options: UseHorizontalScrollOptions) {
  const { containerRef, activeIndex, totalItems, itemSelector = '.scroll-item', isLastItem, isEditing } = options

  const scrollTimeout = ref<number | null>(null)
  const isManualScroll = ref(false)
  const navigationLock = ref(false)
  const isScrolling = ref(false)

  const handleWheel = (event: WheelEvent) => {
    if (!containerRef.value) return

    if (Math.abs(event.deltaY) > 0) {
      event.preventDefault()
      const isMobile = window.innerWidth <= 850

      if (isMobile) {
        containerRef.value.scrollTop += event.deltaY
      } else {
        containerRef.value.scrollLeft += event.deltaY
      }
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

    isScrolling.value = true

    if (scrollTimeout.value) {
      clearTimeout(scrollTimeout.value)
    }

    scrollTimeout.value = window.setTimeout(() => {
      if (!isManualScroll.value && !navigationLock.value) {
        updateActiveFromScroll()
        isScrolling.value = false
      }
    }, 300)
  }

  const updateActiveFromScroll = () => {
    if (!containerRef.value) return

    const container = containerRef.value
    const isMobile = window.innerWidth <= 850
    const items = container.querySelectorAll(itemSelector)

    let closestIndex = 0
    let closestDistance = Infinity

    items.forEach((item, index) => {
      const element = item as HTMLElement

      if (isMobile) {
        const containerCenter = container.scrollTop + container.clientHeight / 2
        const itemCenter = element.offsetTop + element.offsetHeight / 2
        const distance = Math.abs(containerCenter - itemCenter)

        if (distance < closestDistance) {
          closestDistance = distance
          closestIndex = index
        }
      } else {
        const containerCenter = container.scrollLeft + container.clientWidth / 2
        const itemCenter = element.offsetLeft + element.offsetWidth / 2
        const distance = Math.abs(containerCenter - itemCenter)

        if (distance < closestDistance) {
          closestDistance = distance
          closestIndex = index
        }
      }
    })

    if (closestIndex !== activeIndex.value && closestIndex >= 0 && closestIndex < totalItems.value) {
      activeIndex.value = closestIndex
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    console.log('Key pressed:', e.key, 'Target:', e.target)

    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      e.stopPropagation()
      const newIndex = Math.max(0, activeIndex.value - 1)
      console.log('Arrow Left/Up - changing from', activeIndex.value, 'to', newIndex, 'totalItems:', totalItems.value)
      scrollToItem(newIndex)
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      e.stopPropagation()
      if (activeIndex.value >= totalItems.value - 1) {
        console.log('Arrow Right/Down - already at last valid item')
        return
      }
      const newIndex = Math.min(totalItems.value - 1, activeIndex.value + 1)
      console.log('Arrow Right/Down - changing from', activeIndex.value, 'to', newIndex, 'totalItems:', totalItems.value)
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
      const isMobile = window.innerWidth <= 850
      const isLast = isLastItem ? isLastItem(index) : false
      const editing = isEditing ? isEditing() : false
      const isFirstEditing = editing && index === 0

      if (isMobile) {
        let scrollTop
        if (isLast) {
          scrollTop = containerRef.value.scrollTop + (itemRect.top - containerRect.top) - 50
        } else {
          scrollTop = containerRef.value.scrollTop + (itemRect.top - containerRect.top) - (containerRect.height - itemRect.height) / 2
        }

        containerRef.value.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        })
      } else {
        let scrollLeft
        if (isLast) {
          scrollLeft = containerRef.value.scrollLeft + (itemRect.left - containerRect.left) - (containerRect.width - itemRect.width) * 0.1
        } else if (isFirstEditing) {
          scrollLeft = containerRef.value.scrollLeft + (itemRect.left - containerRect.left) - 350
        } else {
          scrollLeft = containerRef.value.scrollLeft + (itemRect.left - containerRect.left) - (containerRect.width - itemRect.width) / 2
        }

        containerRef.value.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        })
      }

      scrollTimeout.value = window.setTimeout(() => {
        navigationLock.value = false
        isManualScroll.value = false
        isScrolling.value = false
        console.log('navigationLock released, activeIndex:', activeIndex.value)
      }, 800)
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
    isScrolling,
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
