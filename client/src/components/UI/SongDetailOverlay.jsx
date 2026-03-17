import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Pause, Heart, Clock, Loader2, Plus, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react'
import { usePlayerStore, useToastStore } from '../../store/store'
import { usePlayerContext } from '../../context/PlayerContext'
import { supabase } from '../../lib/supabase'
import SongCard from './SongCard'

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

export default function SongDetailOverlay() {
  const progressRef = useRef(null)
  const { 
    user, detailTrack, isDetailOpen, closeDetail, setCurrentTrack, setQueue,
    isPlaying, volume, isMuted, progress, duration,
    setIsPlaying, setVolume, setMuted
  } = usePlayerStore()
  const { playTrack, seekTo, togglePlay, playNextTrack, playPrevTrack } = usePlayerContext() || {}
  const [recommendations, setRecommendations] = useState([])
  const [loadingRecs, setLoadingRecs] = useState(false)
  const addToast = useToastStore(s => s.addToast)

  // Fetch recommendations when overlay opens
  useEffect(() => {
    if (!detailTrack || !isDetailOpen) return
    let mounted = true
    
    const fetchRecs = async () => {
      setLoadingRecs(true)
      try {
        const params = `videoId=${detailTrack.videoId}&q=${encodeURIComponent(detailTrack.title)}`
        const API_BASE = import.meta.env.VITE_API_BASE || '';
        const res = await fetch(`${API_BASE}/api/recommendations?${params}`)
        const data = await res.json()
        if (mounted) setRecommendations(data.results || [])
      } catch (err) {
        console.error('Failed to fetch recs', err)
      } finally {
        if (mounted) setLoadingRecs(false)
      }
    }
    
    fetchRecs()
    return () => { mounted = false }
  }, [detailTrack?.videoId, isDetailOpen])

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isDetailOpen) closeDetail()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isDetailOpen, closeDetail])

  const handlePlayNow = () => {
    // If we're clicking the giant play/pause and this track is ALREADY current, just toggle play state list BottomPlayer does.
    const isCurrent = detailTrack?.videoId === usePlayerStore.getState().currentTrack?.videoId
    
    if (isCurrent) {
      if (togglePlay) togglePlay()
      else setIsPlaying(!isPlaying)
      return
    }

    if (playTrack) {
      if (recommendations.length > 0) playTrack(detailTrack, [detailTrack, ...recommendations], 0)
      else playTrack(detailTrack)
    } else {
      if (recommendations.length > 0) setQueue([detailTrack, ...recommendations], 0)
      else setCurrentTrack(detailTrack)
    }
  }

  const handleProgressClick = useCallback((e) => {
    if (!progressRef.current || !duration) return
    const rect = progressRef.current.getBoundingClientRect()
    seekTo?.((e.clientX - rect.left) / rect.width * duration)
  }, [duration, seekTo])

  const handleSave = async (e) => {
    e.stopPropagation()
    if (!user?.phone) return
    try {
      const { error } = await supabase.from('library').upsert({
        user_phone: user.phone,
        video_id: detailTrack.videoId,
        title: detailTrack.title,
        channel: detailTrack.channel,
        thumbnail: detailTrack.thumbnail,
        duration: detailTrack.duration
      }, { onConflict: 'user_phone,video_id' })
      if (error) throw error
      addToast('Saved to library ❤️')
    } catch (err) { 
      console.error('🔥 Supabase Save Error:', err)
      addToast('Failed to save (check console)', 'error') 
    }
  }

  return createPortal(
    <AnimatePresence>
      {isDetailOpen && detailTrack && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 flex justify-center overflow-y-auto"
          style={{
            zIndex: 99999,
            background: 'rgba(7, 7, 15, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDetail()
          }}
        >
          {/* Close Button Top Right */}
          <button
            onClick={closeDetail}
            className="fixed top-6 right-6 z-50 p-2 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            <X size={24} />
          </button>

          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full max-w-5xl my-8 mx-4 md:my-16 flex flex-col gap-8 pb-32"
          >
            
            {/* Top Hero Section */}
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start p-6 md:p-10 rounded-3xl"
                 style={{
                   background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(99,102,241,0.05) 100%)',
                   border: '1px solid rgba(167,139,250,0.2)',
                   boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
                 }}>
              
              {/* Big Thumbnail */}
              <div className="w-64 h-64 md:w-80 md:h-80 shrink-0 relative rounded-2xl overflow-hidden shadow-2xl"
                   style={{ 
                     border: '1px solid rgba(255,255,255,0.1)',
                     boxShadow: '0 20px 48px rgba(167,139,250,0.3)'
                   }}>
                <img 
                  src={detailTrack.thumbnail} 
                  alt={detailTrack.title} 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info & Actions */}
              <div className="flex flex-col flex-1 items-center md:items-start text-center md:text-left">
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px',
                  borderRadius: 99, border: '1px solid rgba(167,139,250,0.3)',
                  background: 'rgba(167,139,250,0.1)', fontSize: 11, fontWeight: 700,
                  color: 'rgba(196,181,253,0.9)', letterSpacing: '0.05em', marginBottom: 16
                }}>
                  SONG
                </div>
                
                <h1 className="text-3xl md:text-5xl font-black text-white mb-2 leading-tight" 
                    style={{ letterSpacing: '-0.02em', textWrap: 'balance' }}>
                  {detailTrack.title}
                </h1>
                
                <h2 className="text-xl md:text-2xl font-semibold mb-6" 
                    style={{ color: 'rgba(196,181,253,0.9)' }}>
                  {detailTrack.channel}
                </h2>

                {/* Is it the currently playing track? */}
                {(() => {
                  const isCurrent = detailTrack?.videoId === usePlayerStore.getState().currentTrack?.videoId;
                  const pct = isCurrent && duration > 0 ? (progress / duration) * 100 : 0;
                  
                  return (
                    <div className="w-full mt-auto mb-4">
                      
                      {/* Playback Controls (if current track) */}
                      {isCurrent ? (
                        <div className="flex flex-col gap-6 w-full">
                          
                          {/* Progress Bar */}
                          <div className="flex items-center gap-4 w-full">
                            <span className="text-xs font-medium text-slate-400 w-10 text-right tabular-nums">
                              {formatTime(progress)}
                            </span>
                            <div 
                              ref={progressRef}
                              onClick={handleProgressClick}
                              className="flex-1 h-2 bg-white/10 rounded-full cursor-pointer relative overflow-hidden group"
                            >
                              <div 
                                className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full transition-all duration-300 group-hover:from-purple-300 group-hover:to-indigo-300"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-slate-400 w-10 tabular-nums">
                              {formatTime(duration)}
                            </span>
                          </div>

                          {/* Primary Controls */}
                          <div className="flex items-center justify-center gap-6 md:gap-8">
                            
                            <button onClick={playPrevTrack} className="p-2 text-slate-400 hover:text-white transition-colors">
                              <SkipBack size={24} />
                            </button>

                            <button
                              onClick={() => duration && progress && seekTo?.(Math.max(0, progress - 10))}
                              className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors text-xs font-bold"
                            >
                              <span>-10s</span>
                            </button>

                            <button
                              onClick={handlePlayNow}
                              className="w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-indigo-500 shadow-xl hover:scale-105 active:scale-95 transition-all text-white"
                            >
                              {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-2" />}
                            </button>

                            <button
                              onClick={() => duration && progress && seekTo?.(Math.min(duration, progress + 10))}
                              className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors text-xs font-bold"
                            >
                              <span>+10s</span>
                            </button>

                            <button onClick={playNextTrack} className="p-2 text-slate-400 hover:text-white transition-colors">
                              <SkipForward size={24} />
                            </button>

                          </div>

                          {/* Volume & Save */}
                          <div className="flex items-center justify-between w-full mt-2">
                            <button
                              onClick={handleSave}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors text-slate-300 hover:text-white bg-white/5 hover:bg-white/10"
                            >
                              <Heart size={18} /> Save
                            </button>

                            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-lg">
                              <button onClick={() => setMuted(!isMuted)} className="text-slate-400 hover:text-white">
                                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                              </button>
                              <input 
                                type="range" min="0" max="100" 
                                value={isMuted ? 0 : volume}
                                onChange={e => setVolume(Number(e.target.value))}
                                className="w-24 accent-purple-400" 
                              />
                            </div>
                          </div>

                        </div>
                      ) : (
                        // Not the current track playing (User clicked on a recommendation inside the overlay)
                        <div className="flex items-center gap-4">
                          <button
                            onClick={handlePlayNow}
                            className="flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-transform hover:scale-105 active:scale-95"
                            style={{
                              background: 'linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)',
                              color: 'white',
                              boxShadow: '0 8px 32px rgba(167,139,250,0.4)',
                            }}
                          >
                            <Play size={20} fill="white" /> Play Instead
                          </button>

                          <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-6 py-4 rounded-xl font-bold text-lg transition-colors text-white bg-white/5 border border-white/10 hover:bg-white/10"
                          >
                            <Heart size={20} /> Save
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}

              </div>
            </div>

            {/* Related Tracks */}
            <div className="px-2">
              <h3 className="text-2xl font-bold text-white mb-6">Related Tracks</h3>
              
              {loadingRecs ? (
                <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
                  <Loader2 className="animate-spin" size={24} />
                  <span className="font-semibold">Loading recommendations...</span>
                </div>
              ) : recommendations.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {recommendations.map((track, i) => (
                    <motion.div 
                      key={track.videoId + i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <SongCard 
                        track={track} 
                        queue={recommendations} 
                        queueIndex={i} 
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <p>No related tracks found.</p>
                </div>
              )}
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
