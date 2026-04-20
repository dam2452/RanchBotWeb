import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useVideoStore = defineStore('video', () => {
  const userInteracted = ref(false)

  function markInteracted(): void {
    userInteracted.value = true
  }

  return { userInteracted, markInteracted }
})
