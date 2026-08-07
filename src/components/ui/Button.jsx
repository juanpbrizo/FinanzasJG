const VARIANTS = {
  primary: 'bg-slate-900 text-white hover:bg-slate-700 focus-visible:outline-slate-900',
  secondary:
    'bg-white text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus-visible:outline-slate-900',
  danger: 'bg-red-600 text-white hover:bg-red-500 focus-visible:outline-red-600',
  destructive: 'bg-red-600 text-white hover:bg-red-500 focus-visible:outline-red-600',
  outline:
    'bg-white text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus-visible:outline-slate-900',
}

const SIZES = {
  sm: 'px-3 py-2 text-xs min-h-[2.5rem]',
  md: 'px-4 py-2.5 text-sm min-h-[2.75rem]',
  lg: 'px-5 py-3 text-base min-h-[3rem]',
}

export default function Button({
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  isLoading,
  disabled,
  ...props
}) {
  const isDisabled = disabled || isLoading

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-semibold shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${SIZES[size] ?? SIZES.md} ${VARIANTS[variant] ?? VARIANTS.primary} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {isLoading && <span className="animate-spin">⏳</span>}
      {children}
    </button>
  )
}
