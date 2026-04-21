<script setup lang="ts">
import { computed } from 'vue'
import { useWindowWidth } from '@/composables/useWindowWidth'

const { windowWidth } = useWindowWidth()
const isSmallDevice = computed(() => windowWidth.value <= 480)
</script>

<template>
  <main class="error-page">
    <div class="error-content">
      <h1 class="error-message">And they left the full bottles? Something's is wrong...</h1>
      <img
        src="/images/others/bench_with_bottles.svg"
        alt="Error"
        class="error-image"
      />
    </div>
  </main>
</template>

<style scoped lang="scss">
.error-page {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 100%;
  padding: 24px;
  box-sizing: border-box;
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  max-width: 1000px;
  width: 100%;

  @include mobile {
    gap: 20px;
    max-width: 1100px;
  }

  @include tablet {
    gap: 24px;
    max-width: 1200px;
  }
}

.error-message {
  font-size: 1.5rem;
  text-align: center;
  color: var(--color-text);
  margin: 0;
  line-height: 1.3;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

  @include mobile {
    font-size: 2rem;
  }

  @include tablet {
    font-size: 2.5rem;
  }
}

.error-image {
  width: 100%;
  max-width: 600px;
  height: auto;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));

  @include mobile {
    max-width: 700px;
  }

  @include tablet {
    max-width: 800px;
  }
}

@media (max-width: 320px) {
  .error-content {
    gap: 12px;
  }

  .error-message {
    font-size: 1.2rem;
  }

  .error-image {
    max-width: 400px;
  }
}
</style>
