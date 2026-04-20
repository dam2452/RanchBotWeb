<script setup lang="ts">
import { ref } from 'vue'
import { authService } from '@/services/authService'
import { formatDate, getSubscriptionStatus } from '@/utils/subscription'
import LoadingSpinner from '../common/LoadingSpinner.vue'

interface Props {
  visible: boolean
}

const props = defineProps<Props>()

const loading = ref(false)
const error = ref('')
const subscriptionEnd = ref('')
const daysRemaining = ref<number | null>(null)

const loadSubscription = async () => {
  if (!props.visible) return

  loading.value = true
  error.value = ''

  try {
    const data = await authService.getSubscription()
    subscriptionEnd.value = data.subscriptionEnd
    daysRemaining.value = data.daysRemaining
  } catch (err: unknown) {
    error.value = (err instanceof Error ? err.message : null) || 'Failed to fetch subscription data'
  } finally {
    loading.value = false
  }
}

defineExpose({
  loadSubscription
})
</script>

<template>
  <div v-if="visible" class="subscription-tooltip">
    <div v-if="loading" class="loading">
      <LoadingSpinner size="small" :show-message="false" />
      <span>Checking subscription...</span>
    </div>
    <div v-else-if="error" class="error">
      Error: {{ error }}
    </div>
    <div v-else-if="subscriptionEnd">
      <div>Subscription active until: <strong>{{ formatDate(subscriptionEnd) }}</strong></div>
      <div class="days-remaining" :class="getSubscriptionStatus(daysRemaining).className">
        {{ getSubscriptionStatus(daysRemaining).text }}
      </div>
    </div>
    <div v-else class="error">
      No subscription data available
    </div>
  </div>
</template>

<style scoped>
.subscription-tooltip {
  visibility: visible;
  opacity: 1;
  position: absolute;
  background-color: #333;
  color: #fff;
  text-align: left;
  padding: 8px 12px;
  border-radius: 8px;
  z-index: 101;
  min-width: 220px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
  font-size: 0.9em;
  line-height: 1.4;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 8px;
  transition: opacity 0.3s ease;
}

.subscription-tooltip::after {
  content: "";
  position: absolute;
  top: -12px;
  left: 50%;
  margin-left: -6px;
  border-width: 6px;
  border-style: solid;
  border-color: transparent transparent #333 transparent;
}

.loading {
  display: flex;
  align-items: center;
  gap: 8px;
}

.error {
  color: #ff6b6b;
  font-weight: 500;
}

.days-remaining {
  margin-top: 4px;
  font-weight: 500;
}

.days-remaining.expiring {
  color: #ffb142;
}

.days-remaining.expired {
  color: #ff6b6b;
}

@media (max-width: 850px) {
  .subscription-tooltip {
    min-width: 200px;
    font-size: 0.85em;
  }
}
</style>
