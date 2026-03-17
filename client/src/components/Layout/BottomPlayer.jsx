import { useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Heart } from 'lucide-react'
import { usePlayerStore, useToastStore } from '../../store/store'
import { usePlayerContext } from '../../context/PlayerContext'
import { supabase } from '../../lib/supabase'

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

export default function BottomPlayer() {
  const progressRef = useRef(null)
  const { seekTo, togglePlay } = usePlayerContext() || {}
  const {
    currentTrack, isPlaying, volume, isMuted, progress, duration,
    setIsPlaying, setVolume, setMuted, playNext, playPrev
  } = usePlayerStore()
  const addToast = useToastStore(s => s.addToast)

  const handleProgressClick = useCallback((e) => {
    if (!progressRef.current || !duration) return
    const rect = progressRef.current.getBoundingClientRect()
    seekTo?.((e.clientX - rect.left) / rect.width * duration)
  }, [duration, seekTo])

  const handleSave = async () => {
    if (!currentTrack) return
    try {
      const { error } = await supabase.from('library').upsert({
        video_id: currentTrack.videoId, title: currentTrack.title,
        channel: currentTrack.channel, thumbnail: currentTrack.thumbnail,
        duration: currentTrack.duration
      }, { onConflict: 'video_id' })
      if (error) throw error
      addToast('Saved to library ❤️')
    } catch { addToast('Failed to save', 'error') }
  }

  const pct = duration > 0 ? (progress / duration) * 100 : 0
  if (!currentTrack) return null

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      className="fixed left-0 right-0 z-50 bottom-player-wrap"
      style={{
        bottom: 0,
        background: 'linear-gradient(135deg, rgba(15,10,30,0.97) 0%, rgba(20,15,40,0.97) 100%)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        borderTop: '1px solid rgba(167,139,250,0.15)',
        height: 'var(--player-h)',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.6), 0 -1px 0 rgba(167,139,250,0.1)',
      }}
    >
      {/* Mobile: push above MobileNav */}
      <style>{`@media(max-width:767px){.bottom-player-wrap{bottom:60px!important;}}`}</style>

      {/* Progress line */}
      <div
        ref={progressRef}
        onClick={handleProgressClick}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 3, background: 'rgba(255,255,255,0.08)', cursor: 'pointer',
        }}
      >
        <div style={{
          height: '100%', width: `${pct}%`,
          background: 'linear-gradient(90deg, #a78bfa, #818cf8)',
          borderRadius: '0 99px 99px 0',
          boxShadow: '0 0 8px rgba(167,139,250,0.6)',
          transition: 'width 0.4s linear',
        }} />
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', height: '100%',
        padding: '0 16px', gap: 12,
      }}>
        {/* Track info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: '1 1 200px', maxWidth: 280 }}>
          {/* Vinyl art */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 46, height: 46, borderRadius: '50%', overflow: 'hidden',
              border: '2px solid rgba(167,139,250,0.4)',
              boxShadow: '0 0 16px rgba(167,139,250,0.35)',
              animation: isPlaying ? 'spin-slow 10s linear infinite' : undefined,
              animationPlayState: isPlaying ? 'running' : 'paused',
            }}>
              <img src={currentTrack.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            {/* Center hole */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%,-50%)',
              width: 10, height: 10, borderRadius: '50%',
              background: isPlaying ? '#a78bfa' : 'rgba(7,7,15,0.8)',
              boxShadow: isPlaying ? '0 0 8px rgba(167,139,250,0.9)' : 'none',
              transition: 'background 0.3s, box-shadow 0.3s',
            }} />
          </div>

          <div style={{ overflow: 'hidden', flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentTrack.title}
            </p>
            <p style={{ fontSize: 11, color: 'rgba(100,116,139,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentTrack.channel}
            </p>
          </div>

          <button onClick={handleSave} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
            <Heart size={16} style={{ color: 'rgba(167,139,250,0.6)', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#a78bfa'}
              onMouseLeave={e => e.target.style.color = 'rgba(167,139,250,0.6)'} />
          </button>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button
            onClick={playPrev}
            className="hidden sm:flex"
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: '50%',
              color: 'rgba(148,163,184,0.7)', transition: 'color 0.2s, background 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f1f5f9'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(148,163,184,0.7)'; e.currentTarget.style.background = 'none' }}
          >
            <SkipBack size={18} />
          </button>

          <button
            onClick={() => togglePlay ? togglePlay() : setIsPlaying(!isPlaying)}
            style={{
              width: 42, height: 42, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #a78bfa, #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(167,139,250,0.5)',
              transition: 'transform 0.15s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.07)'; e.currentTarget.style.boxShadow = '0 0 32px rgba(167,139,250,0.7)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(167,139,250,0.5)' }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={isPlaying ? 'pause' : 'play'}
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 90 }}
                transition={{ duration: 0.15 }}
              >
                {isPlaying ? <Pause size={17} fill="white" color="white" /> : <Play size={17} fill="white" color="white" style={{ marginLeft: 2 }} />}
              </motion.div>
            </AnimatePresence>
          </button>

          <button
            onClick={playNext}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: '50%',
              color: 'rgba(148,163,184,0.7)', transition: 'color 0.2s, background 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f1f5f9'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(148,163,184,0.7)'; e.currentTarget.style.background = 'none' }}
          >
            <SkipForward size={18} />
          </button>
        </div>

        {/* Time + Volume — desktop */}
        <div className="hidden md:flex" style={{ alignItems: 'center', gap: 10, flexShrink: 0, minWidth: 180, justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 11, color: 'rgba(100,116,139,0.7)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
            {formatTime(progress)} / {formatTime(duration)}
          </span>
          <button onClick={() => setMuted(!isMuted)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(148,163,184,0.6)', padding: 4 }}>
            {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <input type="range" min="0" max="100" value={isMuted ? 0 : volume}
            onChange={e => setVolume(Number(e.target.value))}
            style={{ width: 72, accentColor: '#a78bfa' }} />
        </div>
      </div>
    </motion.div>
  )
}
