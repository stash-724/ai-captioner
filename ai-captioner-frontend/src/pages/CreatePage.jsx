import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Check, Copy, ImagePlus, RefreshCw, Wand2 } from 'lucide-react'
import { api } from '../lib/api'
import { DEFAULT_LENGTH, DEFAULT_TONE, LENGTHS, TONES, validateImage } from '../lib/captionOptions'
import ImageDropzone from '../components/ImageDropzone'
import { CaptionSkeleton } from '../components/PostCard'
import { Alert, Badge, Button, PageHeader, SegmentedControl, buttonClasses } from '../components/ui'

function Step({ number, title }) {
  return (
    <h2 className="mb-4 flex items-center gap-2.5 text-sm font-semibold">
      <span className="grid size-6 place-items-center rounded-full bg-zinc-900 text-xs text-white dark:bg-white dark:text-zinc-900">
        {number}
      </span>
      {title}
    </h2>
  )
}

export default function CreatePage() {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [tone, setTone] = useState(DEFAULT_TONE)
  const [length, setLength] = useState(DEFAULT_LENGTH)
  const [post, setPost] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  const selectFile = useCallback((next) => {
    const problem = validateImage(next)
    if (problem) {
      setError(problem)
      return
    }
    setError(null)
    setPost(null)
    setFile(next)
    setPreviewUrl(URL.createObjectURL(next))
  }, [])

  // Free the old preview's memory when it is replaced or the page unmounts
  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl])

  // Pasting an image anywhere on the page selects it
  useEffect(() => {
    const handlePaste = (event) => {
      if (generating) return
      const item = [...(event.clipboardData?.items ?? [])].find((entry) => entry.kind === 'file')
      const pasted = item?.getAsFile()
      if (pasted) selectFile(pasted)
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [generating, selectFile])

  const reset = () => {
    setFile(null)
    setPreviewUrl(null)
    setPost(null)
    setError(null)
  }

  // First run creates the post; later runs regenerate its caption with the current options
  const generate = async () => {
    setError(null)
    setCopied(false)
    setGenerating(true)
    try {
      const result = post
        ? await api.regenerateCaption(post._id, { tone, length })
        : await api.createPost({ file, tone, length })
      setPost(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const copyCaption = async () => {
    await navigator.clipboard.writeText(post.caption)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <PageHeader title="Caption a photo" description="Upload a photo, pick a style, and let Gemini write the caption." />

      <div className="grid items-start gap-8 lg:grid-cols-[1.15fr_1fr]">
        <section>
          <Step number={1} title="Choose a photo" />
          <ImageDropzone
            file={file}
            previewUrl={previewUrl}
            onSelect={selectFile}
            onClear={reset}
            disabled={generating}
          />
        </section>

        <section className="space-y-6 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <Step number={2} title="Pick a style" />
            <div className="space-y-5">
              <SegmentedControl
                label="Tone"
                name="tone"
                options={TONES}
                value={tone}
                onChange={setTone}
                disabled={generating}
                className="grid-cols-2 sm:grid-cols-4"
              />
              <SegmentedControl
                label="Length"
                name="length"
                options={LENGTHS}
                value={length}
                onChange={setLength}
                disabled={generating}
                className="grid-cols-3"
              />
              <Button size="lg" className="w-full" onClick={generate} loading={generating} disabled={!file}>
                {!generating && (post ? <RefreshCw className="size-4" aria-hidden /> : <Wand2 className="size-4" aria-hidden />)}
                {generating ? 'Writing caption…' : post ? 'Regenerate caption' : 'Generate caption'}
              </Button>
              {!file && <p className="text-center text-xs text-zinc-500">Choose a photo first.</p>}
            </div>
          </div>

          {error && <Alert>{error}</Alert>}

          {(post || generating) && (
            <div
              className="rounded-2xl border border-orange-200 bg-orange-50/60 p-5 sm:p-6 dark:border-orange-500/20 dark:bg-orange-500/5"
              aria-live="polite"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold">Your caption</h2>
                {post && !generating && (
                  <div className="flex gap-1.5">
                    <Badge>{post.tone}</Badge>
                    <Badge>{post.length}</Badge>
                  </div>
                )}
              </div>

              {generating ? (
                <CaptionSkeleton />
              ) : (
                <>
                  <p className="font-serif text-2xl leading-snug sm:text-3xl">{post.caption}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" onClick={copyCaption}>
                      {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                    <Link to="/" className={buttonClasses('secondary', 'sm')}>
                      View in feed
                    </Link>
                    <Button variant="ghost" size="sm" onClick={reset}>
                      <ImagePlus className="size-4" aria-hidden /> Caption another photo
                    </Button>
                  </div>
                  <p className="mt-4 text-xs text-zinc-500">
                    Published to the feed. Change the style above and regenerate to try another caption.
                  </p>
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
