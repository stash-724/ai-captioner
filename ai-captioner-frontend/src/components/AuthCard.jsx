import { Sparkles } from 'lucide-react'

export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="mx-auto max-w-md py-6 sm:py-12">
      <div className="mb-8 text-center">
        <span className="mx-auto mb-5 grid size-12 place-items-center rounded-2xl bg-orange-600 text-white shadow-lg shadow-orange-600/25">
          <Sparkles className="size-6" aria-hidden />
        </span>
        <h1 className="font-serif text-4xl tracking-tight">{title}</h1>
        <p className="mt-2 text-zinc-500">{subtitle}</p>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
        {children}
      </div>
      <p className="mt-6 text-center text-sm text-zinc-500">{footer}</p>
    </div>
  )
}
