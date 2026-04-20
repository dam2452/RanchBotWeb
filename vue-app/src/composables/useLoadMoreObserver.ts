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

  const _setupDesktopObserver = () => {
    if (!loadMoreElementRef.value || !containerRef.value) return

    desktopObserver?.disconnect()

    desktopObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (
            entry.isIntersecting &&
            _canLoadMore() &&
            !isManualScroll.value &&
            activeIndex.value >= loadedClips.value - 2 &&
            Date.now() - getLastLoadTime() > 1000
          ) {
            onLoadMore()
          }
        }
      },
      { root: containerRef.value, threshold: 0.5 }
    )

    desktopObserver.observe(loadMoreElementRef.value)
  }

  const _setupMobileObserver = () => {
    if (!containerRef.value || loadedClips.value >= results.value.length) return

    mobileObserver?.disconnect()

    const items = containerRef.value.querySelectorAll('.reel-item:not(.load-more-item)')
    const lastItem = items[loadedClips.value - 1] as HTMLElement | undefined
    if (!lastItem) return

    mobileObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && _canLoadMore()) {
            onLoadMore()
          }
        }
      },
      { root: containerRef.value, threshold: 0.3 }
    )

    mobileObserver.observe(lastItem)
  }

  const setup = () => {
    nextTick(() => {
      if (IS_MOBILE) {
        _setupMobileObserver()
      } else {
        _setupDesktopObserver()
      }
    })
  }

  const cleanup = () => {
    desktopObserver?.disconnect()
    mobileObserver?.disconnect()
    desktopObserver = null
    mobileObserver = null
  }

  return { setup, cleanup }
}
