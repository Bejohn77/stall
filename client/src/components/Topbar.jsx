import { FiMoon, FiSun, FiSearch } from 'react-icons/fi'
import { useTheme } from '../context/ThemeContext'

export default function Topbar({ title, subtitle }) {
  const { theme, setTheme } = useTheme()

  return (
    <header className="flex items-center justify-between rounded-[28px] border border-slate-200 bg-white/80 px-5 py-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        <label className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 md:flex">
          <FiSearch />
          <span>Search</span>
        </label>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          {theme === 'dark' ? <FiSun /> : <FiMoon />}
        </button>
      </div>
    </header>
  )
}
