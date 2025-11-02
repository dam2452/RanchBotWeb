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
