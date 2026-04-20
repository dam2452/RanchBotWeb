<script setup lang="ts">
interface Props {
  size?: 'small' | 'medium' | 'large'
  clickable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  clickable: true
})
</script>

<template>
  <div class="hero-image-container">
    <router-link v-if="clickable" to="/search" :class="['image-link', `image-${size}`]">
      <img
        src="/images/others/KusyDworek.webp"
        :class="['hero-image', `image-${size}`]"
        alt="Dworek Kusy"
      />
    </router-link>
    <img
      v-else
      src="/images/others/KusyDworek.webp"
      :class="['hero-image', `image-${size}`]"
      alt="Dworek Kusy"
    />
  </div>
</template>

<style scoped>
.hero-image-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.image-link {
  cursor: pointer;
  display: block;
  width: 85%;
  margin: 0 auto;
  transition: transform 0.3s;
}

.image-link:hover {
  transform: scale(1.02);
}

.image-link:active {
  transform: scale(0.95);
}

.hero-image {
  display: block;
  width: 100%;
  height: auto;
  max-height: 300px;
  object-fit: contain;
  border-radius: 18px;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3);
  transition: all 0.4s;
}

@media (min-width: 481px) {
  .hero-image {
    border-radius: 30px;
    max-height: 400px;
  }

  .image-link {
    width: 100%;
  }

  .hero-image.image-medium,
  .hero-image.image-large {
    width: 90%;
    max-width: 720px;
    margin: 0 auto;
  }
}

@media (min-width: 1200px) {
  .image-link.image-large {
    max-width: 800px;
  }

  .hero-image {
    max-height: 600px;
    object-fit: cover;
  }

  .hero-image.image-large {
    width: 100%;
    max-width: 100%;
  }
}

@media (min-width: 1800px) {
  .image-link.image-large {
    max-width: 900px;
  }
}
</style>
