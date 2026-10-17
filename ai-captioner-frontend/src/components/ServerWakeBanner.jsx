import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { api } from '../lib/api'

// The free backend host sleeps after 15 minutes without traffic and takes up to a minute to wake.
// If the health check is slow, tell the visitor what's happening instead of showing a frozen page.
const SLOW_AFTER_MS = 2500

export default function ServerWakeBanner() {
  const [waking, setWaking] = useState(false)

  useEffect(() => {
    let done = false
    const timer = setTimeout(() => !done && setWaking(true), SLOW_AFTER_MS)
    api
      .health()
      .catch(() => {}) // a real outage is reported by the page that needs the data
      .finally(() => {
        done = true
        clearTimeout(timer)
        setWaking(false)
      })
    return () => clearTimeout(timer)
  }, [])

  if (!waking) return null
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-center text-sm text-amber-900 dark:bg-amber-500/15 dark:text-amber-200"
    >
      <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
      Waking up the server. It sleeps when idle on free hosting, so this can take up to a minute.
    </div>
  )
}
