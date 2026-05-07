<script setup lang="ts">
interface Props {
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium'
})
</script>

<template>
  <router-link to="/" class="logo-link">
    <img
      src="/images/branding/logo.svg"
      :class="['logo', `logo-${size}`]"
      alt="RanchBot Logo"
    />
  </router-link>
</template>

<style scoped lang="scss">
.logo-link {
  display: inline-block;
}

.logo {
  transition: transform 0.4s;

  &:hover {
    transform: scale(1.05);
  }
}

.logo-small {
  width: 120px;
}

.logo-medium {
  width: 165px;
}

.logo-large {
  width: clamp(240px, 60vw, 360px);

  @include desktop-up {
    min-width: 240px;
    width: clamp(300px, 30vw, 450px);
  }

  @include large {
    width: clamp(375px, 22.5vw, 525px);
  }
}
</style>
