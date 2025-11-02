export function formatAdjustmentValue(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}s`
}

export function createClipFilename(
  clipIndex: number,
  leftAdjust?: number,
  rightAdjust?: number
): string {
  if (leftAdjust === undefined || rightAdjust === undefined || (leftAdjust === 0 && rightAdjust === 0)) {
    return `clip_${clipIndex + 1}.mp4`
  }

  const leftStr = formatAdjustmentValue(leftAdjust).replace('+', '').replace('s', '')
  const rightStr = formatAdjustmentValue(rightAdjust).replace('+', '').replace('s', '')
  return `clip_${clipIndex + 1}_L${leftStr}_R${rightStr}.mp4`
}

export function downloadFile(url: string, filename: string): void {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
}
