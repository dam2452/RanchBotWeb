<template>
  <div
    class="auth-buttons-container flex items-stretch gap-[10px]"
    :class="{ 'fixed': fixed }"
  >
    <template v-if="authStore.isAuthenticated">
      <div class="relative inline-block">
        <button
          id="user-welcome-link"
          :class="compact ? 'compact-user-btn' : 'user-btn'"
          :style="compact ? '' : 'background: linear-gradient(145deg, #f2a94c, #e09340); color: #fff; box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3);'"
          @click="togglePopup"
        >
          <template v-if="compact">
            <img src="/images/ui/icons/user.svg" alt="" class="compact-icon" />
          </template>
          <template v-else>
            <span class="user-btn-full">Hi, {{ authStore.user?.username }}</span>
            <img src="/images/ui/icons/user.svg" alt="" class="user-btn-icon" />
          </template>
        </button>

        <div v-if="popupOpen" class="profile-popup">
          <div class="popup-header">
            <span class="popup-username">{{ authStore.user?.username }}</span>
          </div>

          <div class="popup-section">
            <div class="popup-section-title">Subscription</div>
            <div v-if="subLoading" class="popup-loading">Checking...</div>
            <template v-else-if="subDays !== null">
              <div class="popup-sub-active">
                Active until: <strong>{{ subEnd }}</strong>
              </div>
              <div class="popup-sub-days" :class="subDays <= 7 ? 'expiring' : ''">
                {{ subDays }} days remaining
              </div>
            </template>
            <div v-else class="popup-sub-none">No active subscription</div>
          </div>

          <div class="popup-section">
            <div class="popup-section-title">Activate Key</div>
            <div class="popup-key-row">
              <input
                v-model="keyInput"
                type="text"
                placeholder="Enter key"
                class="popup-input"
                @keyup.enter="handleRedeemKey"
              />
              <button
                class="popup-btn-small popup-btn-green"
                :disabled="keyLoading || !keyInput.trim()"
                @click="handleRedeemKey"
              >
                {{ keyLoading ? '...' : 'Go' }}
              </button>
            </div>
            <p v-if="keyError" class="popup-message popup-message-error">{{ keyError }}</p>
            <p v-if="keySuccess" class="popup-message popup-message-success">{{ keySuccess }}</p>
          </div>

          <div class="popup-section">
            <div class="popup-section-title">Change Password</div>
            <input
              v-model="oldPassword"
              type="password"
              placeholder="Current password"
              class="popup-input"
            />
            <input
              v-model="newPassword"
              type="password"
              placeholder="New password"
              class="popup-input"
            />
            <button
              class="popup-btn-full"
              :disabled="pwLoading || !oldPassword || !newPassword"
              @click="handleChangePassword"
            >
              {{ pwLoading ? 'Changing...' : 'Change Password' }}
            </button>
            <p v-if="pwError" class="popup-message popup-message-error">{{ pwError }}</p>
            <p v-if="pwSuccess" class="popup-message popup-message-success">{{ pwSuccess }}</p>
          </div>

          <div class="popup-actions">
            <button
              v-if="authStore.user && authStore.user.id < 0"
              class="popup-btn-full popup-btn-blue"
              :disabled="linkTelegramLoading"
              @click="handleLinkTelegram"
            >
              {{ linkTelegramLoading ? '...' : 'Link Telegram' }}
            </button>
            <button
              v-if="showMyClips"
              class="popup-btn-full"
              @click="popupOpen = false; $router.push('/my-clips')"
            >
              My Clips
            </button>
            <button class="popup-btn-full popup-btn-red" @click="handleLogout">
              Logout
            </button>
          </div>
        </div>
      </div>

      <div v-if="linkingCode" class="linking-overlay" @click.self="linkingCode = ''">
        <div class="linking-card">
          <p class="linking-instruction">Send this command to the Telegram bot:</p>
          <code class="linking-code">/link {{ linkingCode }}</code>
          <p class="linking-note">Valid for 30 minutes. After linking, log out and back in.</p>
          <button class="linking-close-btn" @click="linkingCode = ''">Close</button>
        </div>
      </div>
    </template>
    <template v-else>
      <button
        @click="$router.push('/login')"
        style="background: linear-gradient(145deg, #aaaaaa, #999999); color: #fff; box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3);"
        class="btn-default"
      >
        Login
      </button>
      <button
        @click="$router.push('/register')"
        style="background: linear-gradient(145deg, #aaaaaa, #999999); color: #fff; box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3);"
        class="btn-default"
      >
        Register
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { authService } from '@/services/authService'
import { formatDate } from '@/utils/subscription'

interface Props {
  fixed?: boolean
  showMyClips?: boolean
  compact?: boolean
}

withDefaults(defineProps<Props>(), {
  fixed: false,
  showMyClips: true,
  compact: false
})

const authStore = useAuthStore()
const router = useRouter()

const popupOpen = ref(false)
const linkingCode = ref('')
const linkTelegramLoading = ref(false)

const subLoading = ref(false)
const subEnd = ref('')
const subDays = ref<number | null>(null)

const keyInput = ref('')
const keyError = ref('')
const keySuccess = ref('')
const keyLoading = ref(false)

const oldPassword = ref('')
const newPassword = ref('')
const pwError = ref('')
const pwSuccess = ref('')
const pwLoading = ref(false)

const togglePopup = async () => {
  popupOpen.value = !popupOpen.value
  if (popupOpen.value) {
    keyError.value = ''
    keySuccess.value = ''
    pwError.value = ''
    pwSuccess.value = ''
    await loadSubscription()
  }
}

const loadSubscription = async () => {
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

const handleRedeemKey = async () => {
  if (!keyInput.value.trim()) return
  keyError.value = ''
  keySuccess.value = ''
  keyLoading.value = true

  try {
    const result = await authService.redeemKey(keyInput.value.trim())
    keySuccess.value = `Activated! +${result.days} days`
    keyInput.value = ''
    await loadSubscription()
  } catch (err) {
    keyError.value = err instanceof Error ? err.message : 'Failed to activate key'
  } finally {
    keyLoading.value = false
  }
}

const handleChangePassword = async () => {
  if (!oldPassword.value || !newPassword.value) return
  pwError.value = ''
  pwSuccess.value = ''
  pwLoading.value = true

  try {
    await authService.changePassword(oldPassword.value, newPassword.value)
    pwSuccess.value = 'Password changed successfully.'
    oldPassword.value = ''
    newPassword.value = ''
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
    popupOpen.value = false
  } catch (err) {
    console.error('Link Telegram error:', err)
  } finally {
    linkTelegramLoading.value = false
  }
}

const handleLogout = async () => {
  popupOpen.value = false
  await authStore.logout()
  router.push('/login')
}

const handleOutsideClick = (e: Event) => {
  const target = e.target as HTMLElement
  const welcomeLink = document.getElementById('user-welcome-link')
  if (popupOpen.value && !target.closest('.profile-popup') && target !== welcomeLink) {
    popupOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleOutsideClick))
onUnmounted(() => document.removeEventListener('click', handleOutsideClick))
</script>

<style scoped lang="scss">
.auth-buttons-container.fixed {
  position: fixed !important;
  top: calc(1.25rem + env(safe-area-inset-top)) !important;
  right: calc(1.25rem + env(safe-area-inset-right)) !important;
  z-index: 10000 !important;

  @include tablet-down {
    top: calc(0.9375rem + env(safe-area-inset-top)) !important;
    right: calc(0.9375rem + env(safe-area-inset-right)) !important;
  }
}

.btn-default {
  border: none;
  border-radius: 15px;
  transition: all 0.2s;
  padding: 1vh 2.5vw;
  font-size: clamp(14px, 1.4vw, 16px);
  font-weight: bold;
  color: white;

  &:hover { transform: scale(1.05); }
  &:active { transform: scale(0.95); }

  @include tablet-down {
    padding: 10px 20px;
    font-size: 14px;
  }
}

.user-btn {
  border: none;
  border-radius: 15px;
  transition: all 0.2s;
  padding: 1vh 2.5vw;
  font-size: clamp(14px, 1.4vw, 16px);
  font-weight: bold;
  color: white;

  &:hover { transform: scale(1.05); }
  &:active { transform: scale(0.95); }

  @include tablet-down {
    padding: 10px 20px;
    font-size: 14px;
  }

  @include small-mobile {
    padding: 5px 15px;
  }
}

.user-btn-icon { display: none; }
.user-btn-full { display: inline; }

@include tablet-down {
  .user-btn {
    aspect-ratio: 1;
    padding: 0 !important;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }

  .user-btn-icon {
    display: block;
    width: 68%;
    height: 68%;
  }

  .user-btn-full { display: none; }

  .btn-default {
    height: 40px;
    padding: 0 14px !important;
    font-size: 13px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .compact-user-btn { width: 40px; height: 40px; }

  .profile-popup {
    right: -10px;
    min-width: 260px;
    font-size: 13px;
  }
}

.compact-user-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: linear-gradient(145deg, #f2a94c, #e09340);
  color: #fff;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3);
  cursor: pointer;
}

.compact-icon {
  width: 68%;
  height: 68%;
  object-fit: contain;
  filter: brightness(0) invert(1);
}

.profile-popup {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  min-width: 300px;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 16px;
  padding: 0;
  z-index: 20000;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: -8px;
    right: 20px;
    border-width: 0 8px 8px 8px;
    border-style: solid;
    border-color: transparent transparent #2a2a2a transparent;
  }
}

.popup-header {
  padding: 14px 18px;
  background: linear-gradient(135deg, #f2a94c, #e09340);
  color: #fff;
  font-weight: 700;
  font-size: 16px;
}

.popup-section {
  padding: 14px 18px;
  border-bottom: 1px solid #3a3a3a;
}

.popup-section-title {
  color: #999;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.popup-loading {
  color: #888;
  font-size: 13px;
}

.popup-sub-active {
  color: #ddd;
  font-size: 13px;
}

.popup-sub-days {
  color: #27ae60;
  font-size: 13px;
  font-weight: 600;
  margin-top: 2px;

  &.expiring { color: #ffb142; }
}

.popup-sub-none {
  color: #ff6b6b;
  font-size: 13px;
  font-weight: 500;
}

.popup-key-row {
  display: flex;
  gap: 8px;
}

.popup-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #444;
  border-radius: 8px;
  background: #333;
  color: #eee;
  font-size: 13px;
  box-sizing: border-box;

  &::placeholder { color: #777; }
  &:focus { outline: 1px solid #f2a94c; border-color: #f2a94c; }
}

.popup-btn-small {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;

  &:hover { transform: scale(1.03); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.popup-btn-green {
  background: linear-gradient(135deg, #5ba85b, #4a974a);
  color: #fff;
}

.popup-btn-full {
  width: 100%;
  padding: 8px;
  margin-top: 6px;
  border: 1px solid #555;
  border-radius: 8px;
  background: #3a3a3a;
  color: #ddd;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;

  &:hover { background: #444; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.popup-btn-blue {
  background: linear-gradient(135deg, #5b9bd5, #4a87c1);
  border-color: #4a87c1;
  color: #fff;
}

.popup-btn-red {
  background: linear-gradient(135deg, #c0392b, #a93226);
  border-color: #a93226;
  color: #fff;
}

.popup-message {
  font-size: 12px;
  font-weight: 600;
  margin: 6px 0 0;
}

.popup-message-error { color: #ff6b6b; }
.popup-message-success { color: #27ae60; }

.popup-actions {
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.linking-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
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
</style>
