export const IS_MOBILE = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
export const MOBILE_BREAKPOINT = 850
export const WATCH_BREAKPOINT = 196
export const DESKTOP_BREAKPOINT = MOBILE_BREAKPOINT

export function isScreenWidthMobile(): boolean {
  return window.innerWidth <= MOBILE_BREAKPOINT
}

export function isScreenWidthWatch(): boolean {
  return window.innerWidth <= WATCH_BREAKPOINT
}

export function formatAdjustmentValue(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}s`
}

export function createClipFilename(
  clipIndex: number,
  leftAdjust?: number,
  rightAdjust?: number,
  searchQuery?: string
): string {
  const sanitizedQuery = searchQuery ? searchQuery.replace(/[^a-zA-Z0-9]/g, '_') : ''
  const queryPrefix = sanitizedQuery ? `${sanitizedQuery}_` : ''

  if (leftAdjust === undefined || rightAdjust === undefined || (leftAdjust === 0 && rightAdjust === 0)) {
    return `${queryPrefix}clip_${clipIndex + 1}.mp4`
  }

  const leftStr = formatAdjustmentValue(leftAdjust).replace('+', '').replace('s', '')
  const rightStr = formatAdjustmentValue(rightAdjust).replace('+', '').replace('s', '')
  return `${queryPrefix}clip_${clipIndex + 1}_L${leftStr}_R${rightStr}.mp4`
}

export function downloadFile(url: string, filename: string): void {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  downloadFile(url, filename)
  URL.revokeObjectURL(url)
}
