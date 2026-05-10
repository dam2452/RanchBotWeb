<template>
  <div>
    <BurgerButton :open="isOpen" @click="toggleMenu" />

    <Teleport to="body">
      <Transition name="overlay">
        <div v-if="isOpen" class="overlay" @click="closeMenu" />
      </Transition>

      <Transition name="panel">
        <div v-if="isOpen" class="panel" role="dialog" aria-modal="true" aria-label="Menu">
          <template v-if="authStore.isAuthenticated">
            <div class="panel-header">
              <div class="avatar">
                <svg viewBox="0 0 24 24" fill="currentColor" class="avatar-icon">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M12 14c-5 0-8 2.5-8 5v1h16v-1c0-2.5-3-5-8-5z" />
                </svg>
              </div>
              <span class="username">{{ authStore.user?.username }}</span>
            </div>

            <div class="panel-body">
              <MenuSubscriptionSection
                :loading="subLoading"
                :days-remaining="subDays"
                :end-date="subEnd"
              />
              <MenuActionsSection
                :show-my-clips="true"
                :show-link-telegram="showLinkTelegram"
                :telegram-loading="linkTelegramLoading"
                @link-telegram="handleLinkTelegram"
                @go-my-clips="handleGoMyClips"
                @logout="handleLogout"
                @activate-key="showKeyPopup = true"
                @change-password="showPwPopup = true"
              />
            </div>

            <MenuActivateKeySection
              v-model="showKeyPopup"
              :loading="keyLoading"
              :error="keyError"
              :success="keySuccess"
              @redeem="handleRedeemKey"
            />
            <MenuChangePasswordSection
              v-model="showPwPopup"
              :loading="pwLoading"
              :error="pwError"
              :success="pwSuccess"
              @change="handleChangePassword"
            />
          </template>

          <template v-else>
            <div class="panel-header panel-header--guest">
              <span class="brand">RanchBot</span>
            </div>
            <div class="panel-body guest-body">
              <button class="guest-btn" @click="navigate('/login')">Login</button>
              <button class="guest-btn guest-btn--secondary" @click="navigate('/register')">Register</button>
            </div>
          </template>
        </div>
      </Transition>

      <Transition name="overlay">
        <div v-if="linkingCode" class="linking-overlay" @click.self="linkingCode = ''">
          <div class="linking-card">
            <p class="linking-instruction">Send this command to the Telegram bot:</p>
            <code class="linking-code">/link {{ linkingCode }}</code>
            <p class="linking-note">Valid for 30 minutes. After linking, log out and back in.</p>
            <button class="linking-close-btn" @click="linkingCode = ''">Close</button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { authService } from '@/services/authService'
import { formatDate } from '@/utils/subscription'
import BurgerButton from './BurgerButton.vue'
import MenuSubscriptionSection from './sections/MenuSubscriptionSection.vue'
import MenuActivateKeySection from './sections/MenuActivateKeySection.vue'
import MenuChangePasswordSection from './sections/MenuChangePasswordSection.vue'
import MenuActionsSection from './sections/MenuActionsSection.vue'

const authStore = useAuthStore()
const router = useRouter()

const isOpen = ref(false)
const linkingCode = ref('')
const linkTelegramLoading = ref(false)

const subLoading = ref(false)
const subEnd = ref('')
const subDays = ref<number | null>(null)

const keyError = ref('')
const keySuccess = ref('')
const keyLoading = ref(false)

const pwError = ref('')
const pwSuccess = ref('')
const pwLoading = ref(false)

const showKeyPopup = ref(false)
const showPwPopup = ref(false)

const showLinkTelegram = computed(() => !!authStore.user && authStore.user.id < 0)

const _resetFormState = () => {
  keyError.value = ''
  keySuccess.value = ''
  pwError.value = ''
  pwSuccess.value = ''
}

const _loadSubscription = async () => {
  subLoading.value = true
  try {
    const data = await authService.getSubscription()
    subEnd.value = formatDate(data.subscriptionEnd)
    subDays.value = data.daysRemaining
  } catch {
    subEnd.value = ''
    subDays.value = null
  } finally {
    subLoading.value = false
  }
}

const toggleMenu = async () => {
  isOpen.value = !isOpen.value
  if (isOpen.value && authStore.isAuthenticated) {
    const stillAuthenticated = await authStore.checkAuth()
    if (!stillAuthenticated) return
    _resetFormState()
    await _loadSubscription()
  }
}

const closeMenu = () => {
  isOpen.value = false
}

const navigate = (path: string) => {
  closeMenu()
  router.push(path)
}

const handleRedeemKey = async (key: string) => {
  keyError.value = ''
  keySuccess.value = ''
  keyLoading.value = true
  try {
    const result = await authService.redeemKey(key)
    keySuccess.value = `Activated! +${result.days} days`
    await _loadSubscription()
  } catch (err) {
    keyError.value = err instanceof Error ? err.message : 'Failed to activate key'
  } finally {
    keyLoading.value = false
  }
}

const handleChangePassword = async (oldPw: string, newPw: string) => {
  pwError.value = ''
  pwSuccess.value = ''
  pwLoading.value = true
  try {
    await authService.changePassword(oldPw, newPw)
    pwSuccess.value = 'Password changed successfully.'
  } catch (err) {
    pwError.value = err instanceof Error ? err.message : 'Failed to change password'
  } finally {
    pwLoading.value = false
  }
}

const handleLinkTelegram = async () => {
  linkTelegramLoading.value = true
  try {
    const result = await authService.linkTelegram()
    linkingCode.value = result.linking_code
    closeMenu()
  } catch (err) {
    console.error('Link Telegram error:', err)
  } finally {
    linkTelegramLoading.value = false
  }
}

const handleGoMyClips = () => {
  navigate('/my-clips')
}

const handleLogout = async () => {
  closeMenu()
  await authStore.logout()
  router.push('/login')
}

const _handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape') closeMenu()
}

onMounted(() => document.addEventListener('keydown', _handleEscape))
onUnmounted(() => document.removeEventListener('keydown', _handleEscape))
</script>

<style scoped lang="scss">
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 9998;
  backdrop-filter: blur(3px);
}

.panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(340px, 88vw);
  z-index: 9999;
  background: #f5e8cc;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: -6px 0 32px rgba(0, 0, 0, 0.35);
  border-left: 2px solid #c9a06a;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 52px 20px 18px;
  background: linear-gradient(135deg, #f2a94c, #e09340);
  flex-shrink: 0;
}

.panel-header--guest {
  justify-content: center;
  padding: 60px 20px 22px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.4);
}

.avatar-icon {
  width: 24px;
  height: 24px;
  color: #fff;
}

.username {
  color: #fff;
  font-size: 17px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.brand {
  color: #fff;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 1px;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  gap: 8px;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: #c9a06a; border-radius: 2px; }
}

.guest-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 32px 24px;
  justify-content: center;
}

.guest-btn {
  width: 100%;
  padding: 14px;
  border: 2px solid #aa9169;
  border-radius: 14px;
  background: linear-gradient(to right, #fdd99d, #dcae75);
  color: #8b4513;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

  &:hover { transform: scale(1.02); box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3); }
  &:active { transform: scale(0.98); }
}

.guest-btn--secondary {
  background: #e8d5b0;
  border-color: #bfa07a;
  color: #6b3a1f;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);

  &:hover { background: #dfc9a0; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18); }
}

.linking-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  z-index: 20000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.linking-card {
  background: #dcae75;
  border: 3px solid #aa9169;
  border-radius: 24px;
  padding: 32px 36px;
  max-width: 440px;
  width: 100%;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.linking-instruction {
  color: #5a3417;
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 16px;
}

.linking-code {
  display: block;
  background: #fdda9f;
  border: 2px solid #c58b4f;
  border-radius: 12px;
  padding: 14px 20px;
  color: #8b4513;
  font-size: 18px;
  font-weight: bold;
  font-family: monospace;
  margin-bottom: 16px;
  word-break: break-all;
}

.linking-note {
  color: #5a3417;
  font-size: 13px;
  margin: 0 0 20px;
  line-height: 1.5;
}

.linking-close-btn {
  padding: 10px 32px;
  border: 2px solid #aa9169;
  border-radius: 12px;
  background: linear-gradient(to right, #fdd99d, #dcae75);
  color: #8b4513;
  font-size: 15px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: scale(1.04);
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.25);
  }
}

.overlay-enter-active,
.overlay-leave-active { transition: opacity 0.3s ease; }
.overlay-enter-from,
.overlay-leave-to { opacity: 0; }

.panel-enter-active,
.panel-leave-active { transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1); }
.panel-enter-from,
.panel-leave-to { transform: translateX(100%); }
</style>
