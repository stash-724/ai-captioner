import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ImagePlus, Images } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import PostCard, { PostGridSkeleton } from '../components/PostCard'
import { Alert, EmptyState, PageHeader, buttonClasses } from '../components/ui'

export default function FeedPage() {
  const { isAuthenticated } = useAuth()
  const [posts, setPosts] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(async (signal) => {
    try {
      setPosts(await api.getPosts({ signal }))
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  const createLink = (
    <Link to={isAuthenticated ? '/create' : '/register'} className={buttonClasses('primary')}>
      <ImagePlus className="size-4" aria-hidden />
      {isAuthenticated ? 'Caption a photo' : 'Sign up to post'}
    </Link>
  )

  return (
    <>
      <PageHeader
        title="Fresh captions"
        description="Photos from the community, captioned by Gemini."
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

      {!posts && !error && <PostGridSkeleton />}

      {posts?.length === 0 && (
        <EmptyState icon={Images} title="No posts yet" action={createLink}>
          Be the first to upload a photo and see what the AI makes of it.
        </EmptyState>
      )}

      {posts?.length > 0 && (
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      )}
    </>
  )
}
