import { ref } from 'vue'

export type ToastType = 'info' | 'success' | 'error' | 'warning'

const DEFAULT_DURATION_MS = 3500

export function useToast() {
  const message = ref('')
  const type = ref<ToastType>('info')
  const visible = ref(false)

  let _dismissTimer: ReturnType<typeof setTimeout> | null = null

  const show = (msg: string, toastType: ToastType = 'info', duration = DEFAULT_DURATION_MS): void => {
    if (_dismissTimer !== null) {
      clearTimeout(_dismissTimer)
    }
    message.value = msg
    type.value = toastType
    visible.value = true
    _dismissTimer = setTimeout(() => {
      visible.value = false
      _dismissTimer = null
    }, duration)
  }

  const hide = (): void => {
    if (_dismissTimer !== null) {
      clearTimeout(_dismissTimer)
      _dismissTimer = null
    }
    visible.value = false
  }

  return { message, type, visible, show, hide }
}
