import { NavLink } from 'react-router-dom'
import { Home, Search, Library, ListMusic, Settings } from 'lucide-react'

const tabs = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/library', icon: Library, label: 'Library' },
  { to: '/playlists', icon: ListMusic, label: 'Playlists' },
  { to: '/settings', icon: Settings, label: 'More' },
]

export default function MobileNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        background: 'rgba(10,8,20,0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(167,139,250,0.12)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '8px 0 4px' }}>
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'} style={{ flex: 1 }}>
            {({ isActive }) => (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '4px 6px', borderRadius: 12,
                transition: 'all 0.2s',
              }}>
                <div style={{
                  width: 40, height: 32, borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isActive ? 'rgba(167,139,250,0.18)' : 'transparent',
                  transition: 'background 0.2s',
                }}>
                  <Icon
                    size={20}
                    style={{
                      color: isActive ? '#c4b5fd' : 'rgba(100,116,139,0.7)',
                      filter: isActive ? 'drop-shadow(0 0 6px rgba(167,139,250,0.8))' : 'none',
                      transition: 'color 0.2s, filter 0.2s',
                    }}
                  />
                </div>
                <span style={{
                  fontSize: 9, fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#c4b5fd' : 'rgba(100,116,139,0.6)',
                  letterSpacing: '0.03em',
                  transition: 'color 0.2s',
                }}>
                  {label}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
