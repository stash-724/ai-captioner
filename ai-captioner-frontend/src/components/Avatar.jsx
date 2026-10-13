const COLORS = ['bg-orange-500', 'bg-sky-500', 'bg-emerald-500', 'bg-violet-500', 'bg-rose-500', 'bg-amber-500']

// Stable color per username
const colorFor = (name) => COLORS[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % COLORS.length]

export default function Avatar({ name = '?', className = 'size-6 text-xs' }) {
  return (
    <span
      aria-hidden
      className={`inline-grid shrink-0 place-items-center rounded-full font-semibold text-white uppercase ${colorFor(name)} ${className}`}
    >
      {name[0]}
    </span>
  )
}
