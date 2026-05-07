export interface SubscriptionStatus {
  text: string
  className: string
}

export function getSubscriptionStatus(daysRemaining: number | null): SubscriptionStatus {
  if (daysRemaining === null) {
    return { text: 'Unknown', className: '' }
  }

  if (daysRemaining > 1) {
    return {
      text: `Ends in ${daysRemaining} days`,
      className: daysRemaining <= 7 ? 'expiring' : ''
    }
  }

  if (daysRemaining === 1) {
    return { text: 'Ends tomorrow', className: 'expiring' }
  }

  if (daysRemaining === 0) {
    return { text: 'Ends today', className: 'expiring' }
  }

  const absDays = Math.abs(daysRemaining)
  return {
    text: `Expired ${absDays} ${absDays === 1 ? 'day' : 'days'} ago`,
    className: 'expired'
  }
}

export function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }
  } catch {
    return dateStr
  }
  return dateStr
}
