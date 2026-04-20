import { ref, type Ref } from 'vue'
import { DESKTOP_BREAKPOINT } from '@/utils/formatters'

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

  const scrollTimeout = ref<number | null>(null)
  const isManualScroll = ref(false)
  const _navigationLock = ref(false)
  const _isScrolling = ref(false)

  const _isMobile = (): boolean => window.innerWidth <= DESKTOP_BREAKPOINT

  const _handleWheel = (event: WheelEvent): void => {
    if (!containerRef.value) return
    if (isEditing && isEditing()) return

    if (Math.abs(event.deltaY) > 0) {
      event.preventDefault()
      if (_isMobile()) {
        containerRef.value.scrollTop += event.deltaY
      } else {
        containerRef.value.scrollLeft += event.deltaY
      }
    }

    if (scrollTimeout.value) clearTimeout(scrollTimeout.value)
    scrollTimeout.value = window.setTimeout(_updateActiveFromScroll, 150)
  }

  const _handleScroll = (): void => {
    if (isManualScroll.value || _navigationLock.value) return
    if (isEditing && isEditing()) return

    _isScrolling.value = true
    if (scrollTimeout.value) clearTimeout(scrollTimeout.value)

    scrollTimeout.value = window.setTimeout(() => {
      if (!isManualScroll.value && !_navigationLock.value) {
        _updateActiveFromScroll()
        _isScrolling.value = false
      }
    }, 300)
  }

  const _updateActiveFromScroll = (): void => {
    if (!containerRef.value) return
    if (isEditing && isEditing()) return

    const container = containerRef.value
    const isMobile = _isMobile()
    const items = container.querySelectorAll(itemSelector)

    let closestIndex = 0
    let closestDistance = Infinity

    items.forEach((item, index) => {
      const element = item as HTMLElement
      const distance = isMobile
        ? Math.abs((container.scrollTop + container.clientHeight / 2) - (element.offsetTop + element.offsetHeight / 2))
        : Math.abs((container.scrollLeft + container.clientWidth / 2) - (element.offsetLeft + element.offsetWidth / 2))

      if (distance < closestDistance) {
        closestDistance = distance
        closestIndex = index
      }
    })

    if (closestIndex !== activeIndex.value && closestIndex >= 0 && closestIndex < totalItems.value) {
      activeIndex.value = closestIndex
    }
  }

  const _handleKeyDown = (e: KeyboardEvent): void => {
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

  const scrollToItem = (index: number): void => {
    if (!containerRef.value) return

    if (scrollTimeout.value) clearTimeout(scrollTimeout.value)

    _navigationLock.value = true
    isManualScroll.value = true
    activeIndex.value = index

    const items = containerRef.value.querySelectorAll(itemSelector)
    const targetItem = items[index] as HTMLElement
    if (!targetItem) return

    const containerRect = containerRef.value.getBoundingClientRect()
    const itemRect = targetItem.getBoundingClientRect()
    const isMobile = _isMobile()
    const isLast = isLastItem ? isLastItem(index) : false
    const editing = isEditing ? isEditing() : false
    const isFirstEditing = editing && index === 0

    if (isMobile) {
      let scrollTop: number
      if (isLast) {
        scrollTop = containerRef.value.scrollTop + (itemRect.top - containerRect.top) - 50
      } else if (editing) {
        scrollTop = containerRef.value.scrollTop + (itemRect.top - containerRect.top) - 300
      } else {
        scrollTop = containerRef.value.scrollTop + (itemRect.top - containerRect.top) - (containerRect.height - itemRect.height) / 2
      }
      containerRef.value.scrollTo({ top: scrollTop, behavior: 'smooth' })
    } else {
      let scrollLeft: number
      if (isLast) {
        scrollLeft = containerRef.value.scrollLeft + (itemRect.left - containerRect.left) - (containerRect.width - itemRect.width) * 0.3
      } else if (isFirstEditing) {
        scrollLeft = containerRef.value.scrollLeft + (itemRect.left - containerRect.left) - 350
      } else {
        scrollLeft = containerRef.value.scrollLeft + (itemRect.left - containerRect.left) - (containerRect.width - itemRect.width) / 2
      }
      containerRef.value.scrollTo({ left: scrollLeft, behavior: 'smooth' })
    }

    scrollTimeout.value = window.setTimeout(() => {
      _navigationLock.value = false
      isManualScroll.value = false
      _isScrolling.value = false
    }, 800)
  }

  const setupScrollListeners = (): void => {
    if (!containerRef.value) return
    containerRef.value.addEventListener('wheel', _handleWheel, { passive: false })
    containerRef.value.addEventListener('scroll', _handleScroll)
    if (enableKeyboard) {
      document.addEventListener('keydown', _handleKeyDown)
    }
  }

  const cleanupScrollListeners = (): void => {
    if (containerRef.value) {
      containerRef.value.removeEventListener('wheel', _handleWheel)
      containerRef.value.removeEventListener('scroll', _handleScroll)
    }
    if (enableKeyboard) {
      document.removeEventListener('keydown', _handleKeyDown)
    }
  }

  return {
    scrollTimeout,
    isManualScroll,
    scrollToItem,
    setupScrollListeners,
    cleanupScrollListeners
  }
}
