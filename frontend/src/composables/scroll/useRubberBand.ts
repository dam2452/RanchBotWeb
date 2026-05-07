import { ref, type Ref } from 'vue'
import { isScreenWidthMobile } from '@/utils/formatters'

interface UseRubberBandOptions {
  activeIndex: Ref<number>
  totalItems: Ref<number>
  isEditing?: () => boolean
}

const _RUBBER_BAND_STRENGTH = 0.35
const _RUBBER_BAND_DAMPING = 0.554
const _BOUNCE_BACK_MS = 500
const _BOUNCE_THRESHOLD = 5

export function useRubberBand(options: UseRubberBandOptions) {
  const { activeIndex, totalItems, isEditing } = options

  const bounceOffset = ref(0)
  const isBouncing = ref(false)
  const _touchStartY = ref(0)
  const _boundaryDir = ref<'top' | 'bottom' | null>(null)

  const _isMobile = isScreenWidthMobile

  const _rubberBand = (distance: number): number => {
    const abs = Math.abs(distance)
    if (abs < _BOUNCE_THRESHOLD) return 0
    const normalized = abs / window.innerHeight
    const damped = abs * _RUBBER_BAND_STRENGTH / (1 + normalized * _RUBBER_BAND_DAMPING)
    return damped * Math.sign(distance)
  }

  const handleTouchStart = (e: TouchEvent): void => {
    if (!_isMobile()) return
    if (isEditing && isEditing()) return

    _touchStartY.value = e.touches[0]?.clientY ?? 0
    isBouncing.value = false

    if (activeIndex.value <= 0) {
      _boundaryDir.value = 'top'
    } else if (activeIndex.value >= totalItems.value - 1) {
      _boundaryDir.value = 'bottom'
    } else {
      _boundaryDir.value = null
    }
  }

  const handleTouchMove = (e: TouchEvent): void => {
    if (!_isMobile()) return
    if (isEditing && isEditing()) return
    if (_boundaryDir.value === null) return

    const deltaY = (e.touches[0]?.clientY ?? 0) - _touchStartY.value

    if (_boundaryDir.value === 'top' && deltaY > 0) {
      e.preventDefault()
      bounceOffset.value = _rubberBand(deltaY)
    } else if (_boundaryDir.value === 'bottom' && deltaY < 0) {
      e.preventDefault()
      bounceOffset.value = _rubberBand(deltaY)
    } else if (bounceOffset.value !== 0) {
      bounceOffset.value = 0
    }
  }

  const handleTouchEnd = (): void => {
    if (!_isMobile()) return

    if (Math.abs(bounceOffset.value) > _BOUNCE_THRESHOLD) {
      isBouncing.value = true
      bounceOffset.value = 0
      setTimeout(() => { isBouncing.value = false }, _BOUNCE_BACK_MS)
    } else {
      bounceOffset.value = 0
    }

    _boundaryDir.value = null
  }

  return { bounceOffset, isBouncing, handleTouchStart, handleTouchMove, handleTouchEnd }
}
