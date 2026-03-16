import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Heart, Plus, Clock } from 'lucide-react'
import { usePlayerStore, useToastStore } from '../../store/store'
import { supabase } from '../../lib/supabase'

export default function SongCard({ track, queue = [], queueIndex = 0, onAddToPlaylist }) {
  const [hovering, setHovering] = useState(false)
  const { setCurrentTrack, setQueue } = usePlayerStore()
  const addToast = useToastStore(s => s.addToast)

  const handlePlay = () => {
    if (queue.length > 0) setQueue(queue, queueIndex)
    else setCurrentTrack(track)
  }

  const handleSave = async (e) => {
    e.stopPropagation()
    try {
      const { error } = await supabase.from('library').upsert({
        video_id: track.videoId,
        title: track.title,
        channel: track.channel,
        thumbnail: track.thumbnail,
        duration: track.duration
      }, { onConflict: 'video_id' })
      if (error) throw error
      addToast('Saved to library ❤️')
    } catch { addToast('Failed to save', 'error') }
  }

  return (
    <motion.div
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={handlePlay}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={{
        borderRadius: 16,
        background: hovering
          ? 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(99,102,241,0.08) 100%)'
          : 'rgba(255,255,255,0.04)',
        border: hovering
          ? '1px solid rgba(167,139,250,0.35)'
          : '1px solid rgba(255,255,255,0.06)',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: hovering
          ? '0 20px 48px rgba(0,0,0,0.5), 0 0 24px rgba(167,139,250,0.2)'
          : '0 4px 16px rgba(0,0,0,0.2)',
        transition: 'background 0.25s, border-color 0.25s, box-shadow 0.25s',
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
        <img
          src={track.thumbnail}
          alt={track.title}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            transform: hovering ? 'scale(1.08)' : 'scale(1)',
            transition: 'transform 0.5s ease',
          }}
        />
        {/* Dark overlay on hover */}
        <div style={{
          position: 'absolute', inset: 0,
          background: hovering
            ? 'linear-gradient(135deg, rgba(7,7,15,0.65), rgba(139,92,246,0.3))'
            : 'linear-gradient(135deg, rgba(0,0,0,0.1), transparent)',
          transition: 'background 0.3s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {hovering && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'linear-gradient(135deg, #a78bfa, #6366f1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(167,139,250,0.6)',
              }}
            >
              <Play size={20} fill="white" color="white" style={{ marginLeft: 2 }} />
            </motion.div>
          )}
        </div>

        {/* Duration badge */}
        {track.duration && (
          <div style={{
            position: 'absolute', bottom: 8, right: 8,
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 8px', borderRadius: 8,
            background: 'rgba(7,7,15,0.75)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <Clock size={9} color="rgba(148,163,184,0.8)" />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#e2e8f0' }}>{track.duration}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '12px 12px 10px' }}>
        <p style={{
          fontSize: 13, fontWeight: 600, color: '#e2e8f0',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden', lineHeight: 1.4, marginBottom: 4,
        }}>
          {track.title}
        </p>
        <p style={{ fontSize: 11, color: 'rgba(100,116,139,0.9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 10 }}>
          {track.channel}
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={handleSave}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 8,
              background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)',
              color: '#a78bfa', fontSize: 11, fontWeight: 600, cursor: 'pointer',
              transition: 'background 0.2s, transform 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(167,139,250,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(167,139,250,0.1)'}
          >
            <Heart size={11} /> Save
          </button>
          {onAddToPlaylist && (
            <button
              onClick={(e) => { e.stopPropagation(); onAddToPlaylist(track) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 8,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(100,116,139,0.9)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
            >
              <Plus size={11} /> Playlist
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
