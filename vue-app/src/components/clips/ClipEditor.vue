<script setup lang="ts">
import { computed, type Ref } from 'vue'

interface Props {
  clipIndex: number
  leftAdjust: number
  rightAdjust: number
  statusMessage: string
  isUpdatingPreview: boolean
  downloadProgress?: number | null
}

interface Emits {
  (e: 'update:leftAdjust', value: number): void
  (e: 'update:rightAdjust', value: number): void
  (e: 'close'): void
  (e: 'download'): void
  (e: 'save'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const leftValue = computed({
  get: () => props.leftAdjust,
  set: (value) => emit('update:leftAdjust', value)
})

const rightValue = computed({
  get: () => props.rightAdjust,
  set: (value) => emit('update:rightAdjust', value)
})

const formatValue = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}s`
}
</script>

<template>
  <div class="edit-panel">
    <div class="edit-panel-header">
      <h3>Adjust Clip #{{ clipIndex + 1 }}</h3>
      <button @click="emit('close')" class="close-btn" aria-label="Close editor">
        ×
      </button>
    </div>

    <div class="edit-controls">
      <div class="slider-group">
        <label class="slider-label">
          <span>Left (- trim / + extend)</span>
          <span class="slider-value">{{ formatValue(leftAdjust) }}</span>
        </label>
        <input
          v-model.number="leftValue"
          type="range"
          min="-10"
          max="10"
          step="0.5"
          class="slider"
          aria-label="Trim or extend left side"
        />
      </div>

      <div class="slider-group">
        <label class="slider-label">
          <span>Right (- trim / + extend)</span>
          <span class="slider-value">{{ formatValue(rightAdjust) }}</span>
        </label>
        <input
          v-model.number="rightValue"
          type="range"
          min="-10"
          max="10"
          step="0.5"
          class="slider"
          aria-label="Trim or extend right side"
        />
      </div>

      <div class="status-box" role="status" aria-live="polite">
        {{ statusMessage }}
      </div>

      <div class="button-group">
        <button
          @click="emit('download')"
          :disabled="isUpdatingPreview || downloadProgress !== null"
          :style="downloadProgress !== null ? { '--dl-progress': `${downloadProgress}%` } : {}"
          class="edit-btn download-edit-btn"
          :class="{ 'is-downloading': downloadProgress !== null }"
          aria-label="Download adjusted clip"
        >
          {{ downloadProgress !== null ? `${downloadProgress}%` : 'Download' }}
        </button>
        <button
          @click="emit('save')"
          :disabled="isUpdatingPreview"
          class="edit-btn save-edit-btn"
          aria-label="Save adjusted clip"
        >
          Save
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.edit-panel {
  width: 100%;
  box-sizing: border-box;
  background: #f0f0f0;
  border-radius: 0 0 32px 32px;
  padding: 14px;
  border: 2px solid #f2a94c;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
}

.edit-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f8f8;
  margin: -12px -12px 12px;
  border-radius: 12px 12px 0 0;
}

.edit-panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #e0e0e0;
  border: none;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #d0d0d0;
}

.edit-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.slider-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.slider-label {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.slider-value {
  color: #f2a94c;
  font-weight: 600;
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #ddd;
  outline: none;
  cursor: pointer;
}

.slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background: #f2a94c;
  cursor: pointer;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #f2a94c;
  cursor: pointer;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  border: none;
}

.status-box {
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 12px;
  color: #666;
  text-align: center;
}

.button-group {
  display: flex;
  gap: 8px;
}

.edit-btn {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  color: white;
}

.edit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.download-edit-btn {
  background: #f2a94c;
  overflow: hidden;
  position: relative;
}

.download-edit-btn:hover:not(:disabled):not(.is-downloading) {
  background: #e09340;
}

.download-edit-btn.is-downloading {
  opacity: 1;
  cursor: default;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    width: var(--dl-progress, 0%);
    background: rgba(255, 255, 255, 0.25);
    transition: width 0.2s ease;
    border-radius: inherit;
  }
}

.save-edit-btn {
  background: #4CAF50;
}

.save-edit-btn:hover:not(:disabled) {
  background: #45a049;
}
</style>
