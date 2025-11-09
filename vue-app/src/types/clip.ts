export interface ClipInfo {
  index: number
  videoUrl?: string
  thumbnailUrl?: string
  hasError: boolean
  isActive: boolean
  isLastLoaded?: boolean
  isEditing?: boolean
  searchQuery?: string
  userUnmuted?: boolean
  userInteracted?: boolean
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
