<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import SecondaryButton from './SecondaryButton.vue'
import { useWindowWidth } from '@/composables/useWindowWidth'
import { WATCH_BREAKPOINT, MOBILE_BREAKPOINT } from '@/utils/formatters'

const router = useRouter()
const { windowWidth } = useWindowWidth()

const buttonSize = computed(() => {
  if (windowWidth.value <= WATCH_BREAKPOINT) return 'small'
  if (windowWidth.value > MOBILE_BREAKPOINT) return 'large'
  return 'medium'
})

const goToRegister = () => {
  router.push('/register')
}

const goToForgotPassword = () => {
  router.push('/forgot-password')
}
</script>

<template>
  <div v-if="windowWidth > WATCH_BREAKPOINT" class="action-buttons">
    <SecondaryButton :size="buttonSize" @click="goToRegister">
      Create account ?
    </SecondaryButton>

    <SecondaryButton :size="buttonSize" @click="goToForgotPassword">
      Forgot password ?
    </SecondaryButton>
  </div>
</template>

<style scoped lang="scss">
.action-buttons {
  margin-top: 2px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
  max-width: 100%;
  justify-content: center;
  box-sizing: border-box;
}

@include mobile {
  .action-buttons {
    margin-top: 6px;
    gap: 18px;
  }
}

@include tablet {
  .action-buttons {
    flex-direction: row;
    gap: 20px;
    margin-top: 16px;
  }
}
</style>
