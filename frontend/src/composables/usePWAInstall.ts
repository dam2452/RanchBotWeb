import { ref, onMounted, onUnmounted } from 'vue'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const _deferred = ref<BeforeInstallPromptEvent | null>(null)
const _installed = ref(false)
const _dismissed = ref(false)

const _onBeforeInstall = (e: Event) => {
  e.preventDefault()
  _deferred.value = e as BeforeInstallPromptEvent
}

const _onAppInstalled = () => {
  _installed.value = true
  _deferred.value = null
}

let _listenersRegistered = false

export function usePWAInstall() {
  const canInstall = ref(false)

  const _updateCanInstall = () => {
    canInstall.value = !!_deferred.value && !_installed.value && !_dismissed.value
  }

  const install = async (): Promise<boolean> => {
    if (!_deferred.value) return false

    await _deferred.value.prompt()
    const { outcome } = await _deferred.value.userChoice
    _deferred.value = null

    return outcome === 'accepted'
  }

  const dismiss = () => {
    _dismissed.value = true
    _updateCanInstall()
  }

  onMounted(() => {
    if (!_listenersRegistered) {
      window.addEventListener('beforeinstallprompt', _onBeforeInstall)
      window.addEventListener('appinstalled', _onAppInstalled)
      _listenersRegistered = true
    }

    _updateCanInstall()
  })

  onUnmounted(() => {
    _updateCanInstall()
  })

  return { canInstall, install, dismiss }
}
