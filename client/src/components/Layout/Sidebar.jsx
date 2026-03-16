import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Search, Library, ListMusic, Settings, Music2 } from 'lucide-react'
import { usePlayerStore } from '../../store/store'

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/library', icon: Library, label: 'Library' },
  { to: '/playlists', icon: ListMusic, label: 'Playlists' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const recentlyPlayed = usePlayerStore(s => s.recentlyPlayed)

  return (
    <aside
      className="hidden md:flex flex-col fixed top-0 left-0 h-full z-40"
      style={{
        width: 'var(--sidebar-w)',
        paddingBottom: 'var(--player-h)',
        background: 'linear-gradient(180deg, rgba(139,92,246,0.08) 0%, rgba(7,7,15,0.9) 25%, rgba(7,7,15,0.97) 100%)',
        backdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(167,139,250,0.1)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div style={{
          width: 38, height: 38,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 20px rgba(167,139,250,0.5)',
          flexShrink: 0,
        }}>
          <Music2 size={18} color="white" />
        </div>
        <div>
          <p style={{ fontWeight: 800, fontSize: 15, color: '#f1f5f9', letterSpacing: '-0.3px' }}>OP Music</p>
          <p style={{ fontSize: 11, color: 'rgba(167,139,250,0.7)', fontWeight: 500 }}>Personal · Ad-free</p>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(167,139,250,0.3), transparent)', margin: '0 20px 16px' }} />

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3">
        <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(148,163,184,0.5)', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0 12px 10px' }}>
          Navigation
        </p>
        <ul className="space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                style={{ display: 'block' }}
              >
                {({ isActive }) => (
                  <motion.div
                    whileHover={{ x: 3 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px',
                      borderRadius: 12,
                      background: isActive ? 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(99,102,241,0.12))' : 'transparent',
                      border: isActive ? '1px solid rgba(167,139,250,0.3)' : '1px solid transparent',
                      color: isActive ? '#c4b5fd' : 'rgba(148,163,184,0.8)',
                      fontSize: 14,
                      fontWeight: isActive ? 600 : 500,
                      transition: 'background 0.2s, color 0.2s',
                      cursor: 'pointer',
                    }}
                    className={isActive ? '' : 'glass-hover'}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 9,
                      background: isActive ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.05)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: isActive ? '0 0 12px rgba(167,139,250,0.3)' : 'none',
                    }}>
                      <Icon size={16} />
                    </div>
                    {label}
                    {isActive && (
                      <div style={{
                        marginLeft: 'auto', width: 6, height: 6,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #a78bfa, #818cf8)',
                        boxShadow: '0 0 8px rgba(167,139,250,0.8)',
                      }} />
                    )}
                  </motion.div>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Recently Played */}
        {recentlyPlayed.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ height: 1, background: 'rgba(148,163,184,0.08)', margin: '0 6px 16px' }} />
            <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(148,163,184,0.5)', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0 12px 10px' }}>
              Recent
            </p>
            <ul className="space-y-1">
              {recentlyPlayed.slice(0, 5).map(track => (
                <li key={track.videoId}>
                  <button
                    onClick={() => usePlayerStore.getState().setCurrentTrack(track)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 10,
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      transition: 'background 0.2s',
                      textAlign: 'left',
                    }}
                    className="glass-hover"
                  >
                    <img
                      src={track.thumbnail} alt=""
                      style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}
                    />
                    <div style={{ overflow: 'hidden' }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</p>
                      <p style={{ fontSize: 10, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.channel}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>

      {/* Bottom gradient fade */}
      <div style={{ height: 40, background: 'linear-gradient(to top, rgba(7,7,15,0.9), transparent)', pointerEvents: 'none' }} />
    </aside>
  )
}
