import { nextTick, type Ref } from 'vue'
import type { SearchResult } from '@/types'
import { IS_MOBILE } from '@/utils/formatters'

interface UseLoadMoreObserverOptions {
  containerRef: Ref<HTMLElement | null>
  loadMoreElementRef: Ref<HTMLElement | null>
  loadedClips: Ref<number>
  results: Ref<SearchResult[]>
  loadingClips: Ref<boolean>
  isManualScroll: Ref<boolean>
  editingClipIndex: Ref<number | null>
  activeIndex: Ref<number>
  getLastLoadTime: () => number
  onLoadMore: () => void
}

export function useLoadMoreObserver(options: UseLoadMoreObserverOptions) {
  const {
    containerRef, loadMoreElementRef, loadedClips, results,
    loadingClips, isManualScroll, editingClipIndex, activeIndex,
    getLastLoadTime, onLoadMore
  } = options

  let desktopObserver: IntersectionObserver | null = null
  let mobileObserver: IntersectionObserver | null = null

  const _canLoadMore = (): boolean =>
    !loadingClips.value &&
    loadedClips.value < results.value.length &&
    editingClipIndex.value === null

  const _createObserver = (
    element: HTMLElement,
    condition: () => boolean,
    threshold: number
  ): IntersectionObserver => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some(e => e.isIntersecting) && condition()) {
          onLoadMore()
        }
      },
      { root: containerRef.value, threshold }
    )
    observer.observe(element)
    return observer
  }

  const _setupDesktopObserver = (): void => {
    if (!loadMoreElementRef.value || !containerRef.value) return
    desktopObserver?.disconnect()
    desktopObserver = _createObserver(
      loadMoreElementRef.value,
      () =>
        _canLoadMore() &&
        !isManualScroll.value &&
        activeIndex.value >= loadedClips.value - 2 &&
        Date.now() - getLastLoadTime() > 1000,
      0.5
    )
  }

  const _setupMobileObserver = (): void => {
    if (!containerRef.value || loadedClips.value >= results.value.length) return
    mobileObserver?.disconnect()
    const items = containerRef.value.querySelectorAll('.reel-item:not(.load-more-item)')
    const lastItem = items[loadedClips.value - 1] as HTMLElement | undefined
    if (!lastItem) return
    mobileObserver = _createObserver(lastItem, _canLoadMore, 0.3)
  }

  const setup = (): void => {
    nextTick(() => {
      if (IS_MOBILE) {
        _setupMobileObserver()
      } else {
        _setupDesktopObserver()
      }
    })
  }

  const cleanup = (): void => {
    desktopObserver?.disconnect()
    mobileObserver?.disconnect()
    desktopObserver = null
    mobileObserver = null
  }

  return { setup, cleanup }
}
