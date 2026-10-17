import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ImagePlus, Images, Trash2, Wand2 } from 'lucide-react'
import { api } from '../lib/api'
import { DEFAULT_LENGTH, DEFAULT_TONE, LENGTHS, TONES } from '../lib/captionOptions'
import PostCard, { PostGridSkeleton } from '../components/PostCard'
import { Alert, Button, EmptyState, PageHeader, Select, buttonClasses } from '../components/ui'

function OwnedPost({ post, onUpdated, onDeleted }) {
  const [panel, setPanel] = useState(null) // null | 'restyle' | 'delete'
  const [tone, setTone] = useState(post.tone || DEFAULT_TONE)
  const [length, setLength] = useState(post.length || DEFAULT_LENGTH)
  const [busy, setBusy] = useState(null) // null | 'regenerate' | 'delete'
  const [error, setError] = useState(null)

  const regenerate = async () => {
    setBusy('regenerate')
    setError(null)
    try {
      onUpdated(await api.regenerateCaption(post._id, { tone, length }))
      setPanel(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(null)
    }
  }

  const remove = async () => {
    setBusy('delete')
    setError(null)
    try {
      await api.deletePost(post._id)
      onDeleted(post._id)
    } catch (err) {
      setError(err.message)
      setBusy(null)
    }
  }

  return (
    <PostCard post={post} busy={busy === 'regenerate'}>
      <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        {panel === null && (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPanel('restyle')}>
              <Wand2 className="size-4" aria-hidden /> Restyle
            </Button>
            <Button variant="danger-ghost" size="sm" className="ml-auto" onClick={() => setPanel('delete')}>
              <Trash2 className="size-4" aria-hidden /> Delete
            </Button>
          </div>
        )}

        {panel === 'restyle' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Select label="Tone" value={tone} onChange={setTone} options={TONES} disabled={Boolean(busy)} />
              <Select label="Length" value={length} onChange={setLength} options={LENGTHS} disabled={Boolean(busy)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setPanel(null)} disabled={Boolean(busy)}>
                Cancel
              </Button>
              <Button size="sm" onClick={regenerate} loading={busy === 'regenerate'}>
                Regenerate
              </Button>
            </div>
          </div>
        )}

        {panel === 'delete' && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">Delete this post?</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setPanel(null)} disabled={Boolean(busy)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={remove} loading={busy === 'delete'}>
                Delete
              </Button>
            </div>
          </div>
        )}

        {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </PostCard>
  )
}

export default function MyPostsPage() {
  const [posts, setPosts] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(async (signal) => {
    try {
      setPosts(await api.getMyPosts({ signal }))
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  const handleUpdated = (updated) =>
    setPosts((prev) => prev.map((post) => (post._id === updated._id ? updated : post)))
  const handleDeleted = (id) => setPosts((prev) => prev.filter((post) => post._id !== id))

  const createLink = (
    <Link to="/create" className={buttonClasses('primary')}>
      <ImagePlus className="size-4" aria-hidden /> New post
    </Link>
  )

  return (
    <>
      <PageHeader
        title="My posts"
        description={
          posts?.length ? `${posts.length} ${posts.length === 1 ? 'post' : 'posts'}. Restyle a caption or remove a post.` : undefined
        }
        action={createLink}
      />

      {error && (
        <Alert
          onRetry={() => {
            setError(null)
            load()
          }}
          className="mb-6"
        >
          {error}
        </Alert>
      )}

      {!posts && !error && <PostGridSkeleton count={3} />}

      {posts?.length === 0 && (
        <EmptyState icon={Images} title="You haven't posted yet" action={createLink}>
          Upload a photo and Gemini will caption it in the tone you pick.
        </EmptyState>
      )}

      {posts?.length > 0 && (
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
          {posts.map((post) => (
            <OwnedPost key={post._id} post={post} onUpdated={handleUpdated} onDeleted={handleDeleted} />
          ))}
        </div>
      )}
    </>
  )
}
