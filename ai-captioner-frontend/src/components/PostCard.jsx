import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import Avatar from './Avatar'
import { Badge } from './ui'
import { imageUrl, timeAgo } from '../lib/format'

export function CaptionSkeleton() {
  return (
    <div className="space-y-2 py-1" role="status" aria-label="Writing caption">
      <div className="h-4 w-11/12 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
    </div>
  )
}

// Shows a placeholder instead of the browser's broken-image icon and alt text
function PostImage({ src, alt }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div className="flex aspect-4/3 flex-col items-center justify-center gap-2 text-zinc-400 dark:text-zinc-600">
        <ImageOff className="size-8" aria-hidden />
        <span className="text-xs">Image unavailable</span>
      </div>
    )
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className="h-auto w-full" />
}

export default function PostCard({ post, busy = false, children }) {
  const username = post.user?.username ?? 'unknown'
  return (
    <article className="mb-5 break-inside-avoid overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className="relative bg-zinc-100 dark:bg-zinc-800">
        <PostImage src={imageUrl(post.image, 640)} alt={post.caption || 'Uploaded photo'} />
        {post.tone && (
          <div className="absolute top-3 left-3 flex gap-1.5">
            <Badge>{post.tone}</Badge>
            {post.length && <Badge>{post.length}</Badge>}
          </div>
        )}
      </div>
      <div className="p-4">
        {busy ? (
          <CaptionSkeleton />
        ) : (
          <p className="font-serif text-xl leading-snug text-zinc-900 dark:text-zinc-50">{post.caption}</p>
        )}
        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-zinc-500">
          <span className="flex min-w-0 items-center gap-2">
            <Avatar name={username} />
            <span className="truncate font-medium text-zinc-700 dark:text-zinc-300">{username}</span>
          </span>
          <time dateTime={post.createdAt} className="shrink-0">
            {timeAgo(post.createdAt)}
          </time>
        </div>
        {children}
      </div>
    </article>
  )
}

const SKELETON_HEIGHTS = ['h-56', 'h-72', 'h-64', 'h-80', 'h-60', 'h-72']

export function PostGridSkeleton({ count = 6 }) {
  return (
    <div className="columns-1 gap-5 sm:columns-2 lg:columns-3" aria-busy="true" aria-label="Loading posts">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="mb-5 break-inside-avoid overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className={`${SKELETON_HEIGHTS[i % SKELETON_HEIGHTS.length]} animate-pulse bg-zinc-200 dark:bg-zinc-800`} />
          <div className="p-4">
            <CaptionSkeleton />
          </div>
        </div>
      ))}
    </div>
  )
}
