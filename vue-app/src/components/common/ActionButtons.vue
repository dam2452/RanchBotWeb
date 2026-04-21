<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import SecondaryButton from './SecondaryButton.vue'

const router = useRouter()
const windowWidth = ref(window.innerWidth)

const buttonSize = computed(() => {
  if (windowWidth.value <= 196) return 'small'
  if (windowWidth.value >= 851) return 'large'
  return 'medium'
})

const handleResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const goToRegister = () => {
  router.push('/register')
}

const goToForgotPassword = () => {
  router.push('/forgot-password')
}
</script>

<template>
  <div v-if="windowWidth > 196" class="action-buttons">
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
