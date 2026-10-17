const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
const UNITS = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['week', 604_800],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
]

export function timeAgo(date) {
  const seconds = (new Date(date).getTime() - Date.now()) / 1000
  for (const [unit, unitSeconds] of UNITS) {
    if (Math.abs(seconds) >= unitSeconds) return rtf.format(Math.round(seconds / unitSeconds), unit)
  }
  return 'just now'
}

export function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// ImageKit resizes on the fly via the tr query param, so the feed loads small images
export function imageUrl(url, width) {
  if (!url?.includes('ik.imagekit.io')) return url
  return `${url}${url.includes('?') ? '&' : '?'}tr=w-${width}`
}
