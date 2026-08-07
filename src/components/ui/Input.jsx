export default function Input({ label, id, className = '', ...props }) {
  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      ) : null}
      <input
        id={id}
        className={`block w-full rounded-md border-0 px-3 py-2.5 text-base text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-slate-900 disabled:bg-slate-50 disabled:text-slate-500 ${className}`}
        {...props}
      />
    </div>
  )
}
