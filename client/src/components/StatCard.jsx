export default function StatCard({ label, value, hint, accent = 'indigo' }) {
  const accentClasses = {
    indigo: 'from-indigo-500 to-violet-500',
    emerald: 'from-emerald-500 to-teal-500',
    amber: 'from-amber-500 to-orange-500',
    rose: 'from-rose-500 to-pink-500',
  }

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className={`mb-4 h-2 w-16 rounded-full bg-gradient-to-r ${accentClasses[accent]}`} />
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-400">{hint}</p>
    </div>
  )
}
