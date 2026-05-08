import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { MOBILE_BREAKPOINT, WATCH_BREAKPOINT, SHORT_HEIGHT_BREAKPOINT } from '@/utils/formatters'

type LayoutMode = 'watch' | 'mobile' | 'tablet'

const _LAYOUT_HEADER_TOP_VALUES: Record<LayoutMode, string> = {
  watch: '0.75rem',
  mobile: '1rem',
  tablet: '1.5rem',
}

const _LAYOUT_GAP = 8

const windowWidth = ref(window.innerWidth)
const windowHeight = ref(window.innerHeight)
const _searchbarHeight = ref(0)
const _footerHeight = ref(32)

let _listenerCount = 0
let _resizeTimer: ReturnType<typeof setTimeout> | null = null

const layoutMode = computed<LayoutMode>(() => {
  if (windowWidth.value <= WATCH_BREAKPOINT) return 'watch'
  if (windowWidth.value <= MOBILE_BREAKPOINT) return 'mobile'
  return 'tablet'
})

const isShortHeight = computed(() => windowHeight.value < SHORT_HEIGHT_BREAKPOINT)

const _headerOffset = computed(() => {
  if (layoutMode.value === 'watch') return 0
  if (layoutMode.value === 'mobile') return _searchbarHeight.value + _LAYOUT_GAP
  return _searchbarHeight.value + _LAYOUT_GAP
})

const _headerTop = computed(() => _LAYOUT_HEADER_TOP_VALUES[layoutMode.value])

const _availableHeight = computed(() => {
  const totalOffset = _headerOffset.value + _footerHeight.value
  return windowHeight.value - totalOffset
})

function _applyLayoutVars(): void {
  const root = document.documentElement.style
  root.setProperty('--layout-header-top', _headerTop.value)
  root.setProperty('--layout-header-offset', `${Math.round(_headerOffset.value)}px`)
  root.setProperty('--layout-footer-offset', `${_footerHeight.value}px`)
  root.setProperty('--layout-available-height', `${Math.round(_availableHeight.value)}px`)
}

function _onResize(): void {
  if (_resizeTimer) clearTimeout(_resizeTimer)
  _resizeTimer = setTimeout(() => {
    windowWidth.value = window.innerWidth
    windowHeight.value = window.innerHeight
  }, 50)
}

function measureSearchbar(el: HTMLElement | null): void {
  if (!el) return
  _searchbarHeight.value = el.getBoundingClientRect().height
}

function measureFooter(el: HTMLElement | null): void {
  if (!el) return
  _footerHeight.value = el.getBoundingClientRect().height
}

watch([windowWidth, windowHeight, _searchbarHeight], _applyLayoutVars)

export function useWindowWidth() {
  onMounted(() => {
    _listenerCount++
    if (_listenerCount === 1) {
      window.addEventListener('resize', _onResize)
      _applyLayoutVars()
    }
  })

  onUnmounted(() => {
    _listenerCount--
    if (_listenerCount <= 0) {
      _listenerCount = 0
      window.removeEventListener('resize', _onResize)
      if (_resizeTimer) {
        clearTimeout(_resizeTimer)
        _resizeTimer = null
      }
    }
  })

  return {
    windowWidth,
    windowHeight,
    layoutMode,
    isShortHeight,
    measureSearchbar,
    measureFooter,
  }
}
