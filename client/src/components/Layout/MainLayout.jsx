import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Sidebar from './Sidebar'
import BottomPlayer from './BottomPlayer'
import MobileNav from './MobileNav'
import Toast from '../UI/Toast'
import { usePlayerStore } from '../../store/store'

const pageVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit:    { opacity: 0, y: -8,  transition: { duration: 0.14 } },
}

export default function MainLayout() {
  const location = useLocation()
  const currentTrack = usePlayerStore(s => s.currentTrack)

  return (
    <div className="app-bg" style={{ height: '100%', overflow: 'hidden', position: 'relative' }}>

      {/* Ambient orbs (decorative, fixed) */}
      <div style={{
        position: 'fixed', top: '30%', left: '25%', width: 520, height: 520, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Fixed sidebar — desktop only */}
      <Sidebar />

      {/* Main Content Area */}
      <main
        className="main-area"
        style={{
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          position: 'relative',
          zIndex: 1,
          paddingBottom: currentTrack
            ? 'calc(var(--player-h) + var(--mobile-nav-h))'
            : 'var(--mobile-nav-h)',
        }}
      >
        <style>{`
          .main-area {
            width: 100%;
            margin-left: 0;
          }
          @media (min-width: 768px) {
            .main-area {
              /* Push past the fixed sidebar */
              margin-left: var(--sidebar-w);
              /* Calculate precise remaining width so it NEVER overflows the screen */
              width: calc(100% - var(--sidebar-w));
              /* Only need padding for player on desktop */
              padding-bottom: var(--player-h) !important;
            }
          }
        `}</style>
        
        <div style={{ minHeight: '100%' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <BottomPlayer />
      <MobileNav />
      <Toast />
    </div>
  )
}
