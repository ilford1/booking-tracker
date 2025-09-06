// Vietnam timezone utilities (UTC+7)
export const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh'
export const VIETNAM_OFFSET = '+07:00'

/**
 * Formats a date to Vietnam timezone (UTC+7)
 * @param date - Date to format
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string in Vietnam timezone
 */
export function formatDateVN(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: VIETNAM_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  }
  
  return new Intl.DateTimeFormat('en-US', defaultOptions).format(dateObj)
}

/**
 * Formats a date to Vietnam date only (UTC+7)
 * @param date - Date to format
 * @returns Formatted date string (DD/MM/YYYY)
 */
export function formatDateOnlyVN(date: Date | string): string {
  return formatDateVN(date, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/(\d+)\/(\d+)\/(\d+)/, '$2/$1/$3') // Convert MM/DD/YYYY to DD/MM/YYYY
}

/**
 * Formats a date to Vietnam time only (UTC+7)
 * @param date - Date to format
 * @returns Formatted time string (HH:MM)
 */
export function formatTimeOnlyVN(date: Date | string): string {
  return formatDateVN(date, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

/**
 * Gets current time in Vietnam timezone
 * @returns Current date in Vietnam timezone
 */
export function getCurrentTimeVN(): Date {
  const now = new Date()
  // Convert to Vietnam timezone
  const vietnamTime = new Date(now.toLocaleString('en-US', { timeZone: VIETNAM_TIMEZONE }))
  return vietnamTime
}

/**
 * Converts a UTC date to Vietnam timezone
 * @param utcDate - UTC date
 * @returns Date adjusted for Vietnam timezone
 */
export function utcToVietnamTime(utcDate: Date | string): Date {
  const dateObj = typeof utcDate === 'string' ? new Date(utcDate) : utcDate
  return new Date(dateObj.toLocaleString('en-US', { timeZone: VIETNAM_TIMEZONE }))
}

/**
 * Formats a relative time string (e.g., "2 minutes ago") in Vietnam context
 * @param date - Date to compare
 * @returns Relative time string
 */
export function formatRelativeTimeVN(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = getCurrentTimeVN()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) {
    return 'Just now'
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  } else if (diffDays < 30) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
  } else {
    return formatDateOnlyVN(dateObj)
  }
}
