export function Input({ className = '', ...props }) {
  return (
    <input
      className={`min-h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-sky-950 ${className}`}
      {...props}
    />
  );
}
