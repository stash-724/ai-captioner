import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { ArrowLeft, Search, SearchX } from 'lucide-react'
import { api } from '../lib/api'
import { imageUrl } from '../lib/format'
import PostCard, { PostGridSkeleton } from '../components/PostCard'
import { Alert, Button, EmptyState, PageHeader } from '../components/ui'

const EXAMPLES = ['a bird on a branch', 'a fast car', 'trees in the fog', 'flowers in spring', 'a sunny sky']

// Two modes, both driven by the URL so results can be shared and the back button works:
//   /search?q=...      text-to-image: the query is embedded with CLIP's text encoder
//   /search?like=<id>  image-to-image: uses the stored embedding of that post's image
export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const { state } = useLocation()
  const query = params.get('q')?.trim() ?? ''
  const likeId = params.get('like')
  const source = state?.source?._id === likeId ? state.source : null

  const [draft, setDraft] = useState(query)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // Keep the input in sync when the URL changes (example chips, back button)
  const [syncedQuery, setSyncedQuery] = useState(query)
  if (query !== syncedQuery) {
    setSyncedQuery(query)
    setDraft(query)
  }

  useEffect(() => {
    if (!query && !likeId) return
    const controller = new AbortController()
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const posts = likeId
          ? await api.getSimilarPosts(likeId, { signal: controller.signal })
          : await api.searchPosts(query, { signal: controller.signal })
        setResults(posts)
      } catch (err) {
        if (err.name === 'AbortError') return
        setError(err.message)
        setResults(null)
      }
      setLoading(false)
    }
    run()
    return () => controller.abort()
  }, [query, likeId])

  const submit = (event) => {
    event.preventDefault()
    const next = draft.trim()
    if (next) setParams({ q: next })
  }

  const hasSearch = Boolean(query || likeId)

  return (
    <>
      <PageHeader
        title="Search by meaning"
        description="Describe a photo in your own words. CLIP matches your words to what's in the images, not to the captions."
      />

      <form onSubmit={submit} className="mb-4 flex gap-2" role="search">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-zinc-400"
            aria-hidden
          />
          <input
            type="search"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="e.g. a bird sitting on a flowering branch"
            aria-label="Search posts"
            maxLength={200}
            className="h-12 w-full rounded-xl border border-zinc-300 bg-white pr-4 pl-12 text-base shadow-xs transition outline-none placeholder:text-zinc-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <Button type="submit" size="lg" disabled={!draft.trim()} loading={loading && Boolean(query)}>
          Search
        </Button>
      </form>

      <div className="mb-10 flex flex-wrap items-center gap-2">
        <span className="text-sm text-zinc-500">Try:</span>
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setParams({ q: example })}
            className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm text-zinc-700 transition hover:border-orange-400 hover:text-orange-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          >
            {example}
          </button>
        ))}
      </div>

      {likeId && (
        <div className="mb-6 flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          {source && (
            <img src={imageUrl(source.image, 160)} alt="" className="size-14 rounded-xl object-cover" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Posts with similar images</p>
            {source && <p className="truncate font-serif text-lg">{source.caption}</p>}
          </div>
          <Link to="/" className="inline-flex shrink-0 items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
            <ArrowLeft className="size-4" aria-hidden /> Feed
          </Link>
        </div>
      )}

      {error && <Alert className="mb-6">{error}</Alert>}

      {hasSearch && loading && <PostGridSkeleton count={3} />}

      {hasSearch && !loading && results?.length === 0 && (
        <EmptyState icon={SearchX} title="No close matches">
          {likeId
            ? 'No other post looks similar enough to this one yet.'
            : 'Nothing in the feed is close enough to that description. Try describing what you would see in the photo.'}
        </EmptyState>
      )}

      {hasSearch && !loading && results?.length > 0 && (
        <>
          <p className="mb-4 text-sm text-zinc-500">
            {results.length} {results.length === 1 ? 'match' : 'matches'}, closest first. The number on each
            photo is the cosine similarity between the embeddings.
          </p>
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
            {results.map((post, index) => (
              <PostCard key={post._id} post={post} score={post.score} label={index === 0 ? 'Best match' : undefined} />
            ))}
          </div>
        </>
      )}
    </>
  )
}
