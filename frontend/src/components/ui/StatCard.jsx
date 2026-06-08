export function StatCard({ icon: Icon, label, value, tone = 'sky' }) {
  const tones = {
    sky: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-200',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-200',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-200',
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{value ?? 0}</p>
        </div>
        {Icon ? <div className={`rounded-lg p-3 ${tones[tone]}`}><Icon size={22} /></div> : null}
      </div>
    </div>
  );
}
