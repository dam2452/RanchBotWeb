import { ref, type Ref } from 'vue'

interface UseScrollTrackerOptions {
  containerRef: Ref<HTMLElement | null>
  activeIndex: Ref<number>
  totalItems: Ref<number>
  itemSelector: string
  isEditing?: () => boolean
}

export function useScrollTracker(options: UseScrollTrackerOptions) {
  const { containerRef, activeIndex, totalItems, itemSelector, isEditing } = options

  const scrollTimeout = ref<number | null>(null)
  const isManualScroll = ref(false)
  const _navigationLock = ref(false)

  const _isMobile = (): boolean => window.innerWidth <= 850

  const handleWheel = (event: WheelEvent): void => {
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
    scrollTimeout.value = window.setTimeout(updateActiveFromScroll, 150)
  }

  const handleScroll = (): void => {
    if (isManualScroll.value || _navigationLock.value) return
    if (isEditing && isEditing()) return

    if (scrollTimeout.value) clearTimeout(scrollTimeout.value)

    scrollTimeout.value = window.setTimeout(() => {
      if (!isManualScroll.value && !_navigationLock.value) {
        updateActiveFromScroll()
      }
    }, 300)
  }

  const updateActiveFromScroll = (): void => {
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

  const scrollToItem = (index: number, isLastItem?: (index: number) => boolean): void => {
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
    }, 800)
  }

  return { scrollTimeout, isManualScroll, handleWheel, handleScroll, scrollToItem }
}
