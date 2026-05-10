<template>
  <div class="menu-section">
    <div class="section-title">Subscription</div>
    <div v-if="loading" class="sub-loading">Checking...</div>
    <template v-else-if="daysRemaining !== null">
      <div class="sub-active">Active until: <strong>{{ endDate }}</strong></div>
      <div class="sub-days" :class="daysRemaining <= 7 ? 'expiring' : ''">
        {{ daysRemaining }} days remaining
      </div>
    </template>
    <div v-else class="sub-none">No active subscription</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  loading: boolean
  daysRemaining: number | null
  endDate: string
}>()
</script>

<style scoped lang="scss">
.menu-section {
  padding: 14px 20px;
  border-bottom: 1px solid #c9a06a;
}

.section-title {
  color: #a0522d;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.sub-loading { color: #8b6a3e; font-size: 13px; }

.sub-active {
  color: #5a3417;
  font-size: 13px;
}

.sub-days {
  color: #2e7d32;
  font-size: 13px;
  font-weight: 700;
  margin-top: 2px;

  &.expiring { color: #e07b00; }
}

.sub-none {
  color: #c0392b;
  font-size: 13px;
  font-weight: 600;
}
</style>
