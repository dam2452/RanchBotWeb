export interface ClipInfo {
  index: number
  videoUrl?: string
  hasError: boolean
  isActive: boolean
  isLastLoaded?: boolean
  isEditing?: boolean
  searchQuery?: string
}

export interface ClipAdjustmentState {
  leftAdjust: number
  rightAdjust: number
  statusMessage: string
  isUpdatingPreview: boolean
}

export interface ClipEditorEmits {
  (e: 'close'): void
  (e: 'download'): void
  (e: 'save', clipName: string): void
}
