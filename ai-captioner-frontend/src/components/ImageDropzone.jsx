import { useRef, useState } from 'react'
import { ImagePlus, RefreshCw } from 'lucide-react'
import { ACCEPTED_IMAGE_TYPES } from '../lib/captionOptions'
import { formatBytes } from '../lib/format'

export default function ImageDropzone({ file, previewUrl, onSelect, onClear, disabled }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const openPicker = () => inputRef.current?.click()

  const handleDrop = (event) => {
    event.preventDefault()
    setDragging(false)
    const dropped = event.dataTransfer.files?.[0]
    if (dropped && !disabled) onSelect(dropped)
  }

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept={ACCEPTED_IMAGE_TYPES.join(',')}
      className="hidden"
      onChange={(event) => {
        const picked = event.target.files?.[0]
        if (picked) onSelect(picked)
        event.target.value = '' // allow picking the same file again
      }}
    />
  )

  if (previewUrl) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-900 dark:border-zinc-800">
        <img src={previewUrl} alt="Selected photo preview" className="mx-auto max-h-[32rem] w-full object-contain" />
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-linear-to-t from-black/75 to-transparent p-4 pt-10 text-sm text-white">
          <span className="truncate">
            {file?.name} · {file && formatBytes(file.size)}
          </span>
          {!disabled && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 font-medium backdrop-blur transition hover:bg-white/25"
            >
              <RefreshCw className="size-3.5" aria-hidden /> Change photo
            </button>
          )}
        </div>
        {input}
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Choose a photo to caption"
      onClick={openPicker}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          openPicker()
        }
      }}
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`flex aspect-4/3 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition outline-none focus-visible:ring-4 focus-visible:ring-orange-500/30 ${
        dragging
          ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10'
          : 'border-zinc-300 bg-white hover:border-orange-400 hover:bg-orange-50/40 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-orange-500/5'
      }`}
    >
      <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-500/10">
        <ImagePlus className="size-7" aria-hidden />
      </div>
      <p className="font-medium">
        Drop a photo here, or <span className="text-orange-600">browse</span>
      </p>
      <p className="mt-1 text-sm text-zinc-500">JPEG, PNG or WebP up to 5 MB. You can also paste an image.</p>
      {input}
    </div>
  )
}
