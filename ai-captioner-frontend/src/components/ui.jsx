import { useId } from 'react'
import { AlertCircle, Loader2, RotateCw } from 'lucide-react'

const BUTTON_VARIANTS = {
  primary:
    'bg-orange-600 text-white shadow-sm hover:bg-orange-500 focus-visible:outline-orange-600',
  secondary:
    'border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 focus-visible:outline-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800',
  ghost:
    'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-zinc-400 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-500 focus-visible:outline-red-600',
  'danger-ghost':
    'text-zinc-600 hover:bg-red-50 hover:text-red-600 focus-visible:outline-red-600 dark:text-zinc-400 dark:hover:bg-red-950/40 dark:hover:text-red-400',
}

const BUTTON_SIZES = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-sm',
  md: 'h-10 gap-2 rounded-xl px-4 text-sm',
  lg: 'h-12 gap-2 rounded-xl px-6 text-base',
}

// Exported so links can look like buttons
export const buttonClasses = (variant = 'primary', size = 'md') =>
  `inline-flex items-center justify-center font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-60 ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]}`

export function Button({ variant, size, loading = false, className = '', children, ...props }) {
  return (
    <button
      type="button"
      {...props}
      disabled={loading || props.disabled}
      className={`${buttonClasses(variant, size)} ${className}`}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

export function Spinner({ className = 'size-6' }) {
  return <Loader2 className={`animate-spin text-orange-600 ${className}`} aria-label="Loading" />
}

export function Field({ label, error, hint, className = '', ...inputProps }) {
  const id = useId()
  const messageId = `${id}-message`
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? messageId : undefined}
        className="block h-11 w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-sm shadow-xs transition outline-none placeholder:text-zinc-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 aria-invalid:border-red-500 aria-invalid:focus:ring-red-500/15 dark:border-zinc-700 dark:bg-zinc-900"
        {...inputProps}
      />
      {(error || hint) && (
        <p
          id={messageId}
          className={`mt-1.5 text-xs ${error ? 'text-red-600 dark:text-red-400' : 'text-zinc-500'}`}
        >
          {error || hint}
        </p>
      )}
    </div>
  )
}

export function Alert({ children, onRetry, className = '' }) {
  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200 ${className}`}
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="flex-1">{children}</div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1 font-medium underline-offset-2 hover:underline"
        >
          <RotateCw className="size-3.5" aria-hidden /> Retry
        </button>
      )}
    </div>
  )
}

// Radio group styled as selectable tiles
export function SegmentedControl({ label, name, options, value, onChange, disabled, className = '' }) {
  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</legend>
      <div className={`grid gap-2 ${className}`}>
        {options.map((option) => {
          const selected = option.value === value
          return (
            <label
              key={option.value}
              className={`cursor-pointer rounded-xl border px-3 py-2.5 text-center transition has-focus-visible:ring-2 has-focus-visible:ring-orange-500 has-disabled:cursor-not-allowed has-disabled:opacity-60 ${
                selected
                  ? 'border-orange-500 bg-orange-50 text-orange-900 dark:bg-orange-500/10 dark:text-orange-100'
                  : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span className="block text-sm font-medium">{option.label}</span>
              {option.hint && <span className="mt-0.5 block text-xs opacity-70">{option.hint}</span>}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export function Select({ label, value, onChange, options, disabled }) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-zinc-500">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="h-9 w-full rounded-lg border border-zinc-300 bg-white px-2.5 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export function Badge({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white capitalize backdrop-blur-sm">
      {children}
    </span>
  )
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-zinc-300 px-6 py-16 text-center dark:border-zinc-700">
      {Icon && (
        <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-500/10">
          <Icon className="size-6" aria-hidden />
        </div>
      )}
      <h2 className="text-lg font-semibold">{title}</h2>
      {children && <p className="mt-1 max-w-sm text-sm text-zinc-500">{children}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function PageHeader({ title, description, action }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">{title}</h1>
        {description && <p className="mt-2 text-zinc-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}
