import { motion } from 'framer-motion'
import { Settings as SettingsIcon, Moon, Sun, Keyboard, Database, ExternalLink } from 'lucide-react'
import { useThemeStore, usePlayerStore } from '../store/store'

const shortcuts = [
  { key: 'Space', action: 'Play / Pause' },
  { key: 'Alt + →', action: 'Next Track' },
  { key: 'Alt + ←', action: 'Previous Track' },
  { key: 'M', action: 'Mute / Unmute' },
]

export default function Settings() {
  const { theme, toggleTheme } = useThemeStore()
  const clearRecent = usePlayerStore(s => s.clearRecentlyPlayed)

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const isConfigured = supabaseUrl && supabaseUrl.startsWith('http') && supabaseUrl !== 'your_supabase_project_url'

  return (
    <div className="px-4 sm:px-6 md:px-8 py-6 md:py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #a78bfa, #818cf8)' }}>
            <SettingsIcon size={16} color="white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        </div>

        {/* Appearance */}
        <section className="glass rounded-2xl p-4 md:p-6 mb-4 md:mb-5">
          <h2 className="font-semibold text-sm md:text-base mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            {theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />} Appearance
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Theme</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{theme === 'dark' ? 'Dark' : 'Light'} mode</p>
            </div>
            <button onClick={toggleTheme} className="flex items-center gap-2 px-3 py-2 md:px-4 rounded-xl glass glass-hover transition-all" style={{ color: 'var(--text-primary)' }}>
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              <span className="text-xs md:text-sm font-medium">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </section>

        {/* Keyboard Shortcuts */}
        <section className="glass rounded-2xl p-4 md:p-6 mb-4 md:mb-5">
          <h2 className="font-semibold text-sm md:text-base mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Keyboard size={15} /> Keyboard Shortcuts
          </h2>
          <div className="space-y-2">
            {shortcuts.map(({ key, action }) => (
              <div key={key} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <span className="text-xs md:text-sm" style={{ color: 'var(--text-secondary)' }}>{action}</span>
                <kbd className="rounded-lg px-2.5 py-1 text-xs font-mono font-semibold glass" style={{ color: 'var(--accent)' }}>{key}</kbd>
              </div>
            ))}
          </div>
        </section>

        {/* Database Status */}
        <section className="glass rounded-2xl p-4 md:p-6 mb-4 md:mb-5">
          <h2 className="font-semibold text-sm md:text-base mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Database size={15} /> Database
          </h2>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Supabase</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Library &amp; Playlists storage</p>
            </div>
            <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full ${isConfigured ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
              <div className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-green-400' : 'bg-red-400'}`} />
              {isConfigured ? 'Connected' : 'Not configured'}
            </div>
          </div>
          <a href="https://supabase.com" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs hover:underline" style={{ color: 'var(--accent)' }}>
            Supabase Dashboard <ExternalLink size={11} />
          </a>
        </section>

        {/* Data */}
        <section className="glass rounded-2xl p-4 md:p-6">
          <h2 className="font-semibold text-sm md:text-base mb-4" style={{ color: 'var(--text-primary)' }}>Data</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Clear Recent History</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Removes local listening history</p>
            </div>
            <button onClick={clearRecent} className="px-3 py-2 md:px-4 rounded-xl text-xs md:text-sm font-medium glass glass-hover transition-all" style={{ color: '#f87171' }}>
              Clear
            </button>
          </div>
        </section>
      </motion.div>
    </div>
  )
}
