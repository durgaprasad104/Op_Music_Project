import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, Sparkles, TrendingUp, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePlayerStore } from '../store/store'
import SongCard from '../components/UI/SongCard'
import SkeletonCard from '../components/UI/SkeletonCard'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return { text: 'Good morning', emoji: '☀️' }
  if (h < 17) return { text: 'Good afternoon', emoji: '🌤️' }
  return { text: 'Good evening', emoji: '🌙' }
}

export default function Home() {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const recentlyPlayed = usePlayerStore(s => s.recentlyPlayed)
  const { text, emoji } = getGreeting()

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const recent = recentlyPlayed[0]
        const params = recent ? `videoId=${recent.videoId}&q=${encodeURIComponent(recent.title)}` : ''
        const API_BASE = import.meta.env.VITE_API_BASE || '';
        const res = await fetch(`${API_BASE}/api/recommendations?${params}`)
        const data = await res.json()
        setRecommendations(data.results || [])
      } catch { /* silent */ }
      finally { setLoading(false) }
    }
    fetchRecs()
  }, [recentlyPlayed[0]?.videoId])

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* ── Hero Banner ── */}
      <div style={{ position: 'relative', overflow: 'hidden', padding: '48px 32px 40px', marginBottom: 0 }}>
        {/* Background gradient blobs */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: 'linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(99,102,241,0.1) 40%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 70%)',
          zIndex: 0,
        }} />
        <div style={{
          position: 'absolute', bottom: -40, left: '40%', width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
          zIndex: 0,
        }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px',
                borderRadius: 99, border: '1px solid rgba(167,139,250,0.3)',
                background: 'rgba(167,139,250,0.1)', fontSize: 11, fontWeight: 600,
                color: 'rgba(196,181,253,0.9)', letterSpacing: '0.05em',
              }}>
                <Sparkles size={12} /> Personalized for you
              </div>
            </div>

            <h1 style={{
              fontSize: 'clamp(28px, 5vw, 52px)',
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              marginBottom: 12,
              background: 'linear-gradient(135deg, #f1f5f9 0%, #c4b5fd 45%, #818cf8 80%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              {emoji} {text}
            </h1>

            <p style={{ fontSize: 16, color: 'rgba(148,163,184,0.8)', marginBottom: 28, maxWidth: 500 }}>
              Your personal ad-free music universe. Search, play, and save anything from YouTube.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/search">
                <motion.button
                  whileHover={{ y: -2, boxShadow: '0 16px 40px rgba(167,139,250,0.45)' }}
                  whileTap={{ scale: 0.96 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '12px 24px', borderRadius: 14,
                    background: 'linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)',
                    color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(167,139,250,0.35)',
                  }}
                >
                  <Play size={16} fill="white" />
                  Discover Music
                </motion.button>
              </Link>
              <Link to="/library">
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '12px 24px', borderRadius: 14,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(203,213,225,0.9)', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                  }}
                >
                  Your Library
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Content Area ── */}
      <div style={{ padding: '8px 24px 24px' }}>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}
        >
          {[
            { icon: <Clock size={14} />, label: 'Recently Played', value: `${recentlyPlayed.length} tracks` },
            { icon: <TrendingUp size={14} />, label: 'Smart Recs', value: `${recommendations.length} ready` },
            { icon: <Sparkles size={14} />, label: 'Ad-Free', value: '100% clean' },
          ].map((stat, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 16px', borderRadius: 12,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              flex: '1 1 140px',
            }}>
              <div style={{ color: 'var(--accent)', opacity: 0.8 }}>{stat.icon}</div>
              <div>
                <p style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>{stat.label}</p>
                <p style={{ fontSize: 13, color: 'var(--text1)', fontWeight: 700 }}>{stat.value}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Recently Played */}
        {recentlyPlayed.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.3px' }}>
                Recently Played
              </h2>
              <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}>See all →</span>
            </div>
            <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
              {recentlyPlayed.slice(0, 10).map((track, i) => (
                <motion.div key={track.videoId}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{ minWidth: 165, maxWidth: 165, flexShrink: 0 }}
                >
                  <SongCard track={track} />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Recommendations */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{
              padding: '4px 10px', borderRadius: 99,
              background: 'rgba(167,139,250,0.12)',
              border: '1px solid rgba(167,139,250,0.25)',
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.05em' }}>
                {recentlyPlayed.length > 0 ? '✨ FOR YOU' : '🔥 TRENDING'}
              </span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.3px' }}>
              {recentlyPlayed.length > 0 ? 'Recommended' : 'Popular Music'}
            </h2>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))', gap: 14 }}>
              {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : recommendations.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))', gap: 14 }}>
              {recommendations.map((track, i) => (
                <motion.div key={track.videoId}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <SongCard track={track} queue={recommendations} queueIndex={i} />
                </motion.div>
              ))}
            </div>
          ) : (
            /* Empty state — premium */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '60px 32px', borderRadius: 24,
                background: 'linear-gradient(135deg, rgba(139,92,246,0.07) 0%, rgba(99,102,241,0.04) 100%)',
                border: '1px solid rgba(167,139,250,0.12)',
                textAlign: 'center',
              }}
            >
              <div className="float" style={{
                width: 80, height: 80, borderRadius: 24, marginBottom: 24,
                background: 'linear-gradient(135deg, rgba(167,139,250,0.25), rgba(99,102,241,0.15))',
                border: '1px solid rgba(167,139,250,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36, boxShadow: '0 20px 60px rgba(167,139,250,0.2)',
              }}>
                🎵
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text1)', marginBottom: 8 }}>
                Start your journey
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 28, maxWidth: 320, lineHeight: 1.6 }}>
                Search for any song, artist, or album to start building personalized recommendations.
              </p>
              <Link to="/search">
                <motion.button
                  whileHover={{ y: -3, boxShadow: '0 16px 40px rgba(167,139,250,0.5)' }}
                  whileTap={{ scale: 0.96 }}
                  style={{
                    padding: '13px 28px', borderRadius: 14,
                    background: 'linear-gradient(135deg, #a78bfa, #6366f1)',
                    color: '#fff', fontWeight: 700, fontSize: 14,
                    border: 'none', cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(167,139,250,0.35)',
                  }}
                >
                  🔍 Search Music
                </motion.button>
              </Link>
            </motion.div>
          )}
        </section>
      </div>
    </div>
  )
}
