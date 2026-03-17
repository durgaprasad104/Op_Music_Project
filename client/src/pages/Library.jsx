import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Library as LibraryIcon, Trash2, Play } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { usePlayerStore, useToastStore } from '../store/store'
import { usePlayerContext } from '../context/PlayerContext'

export default function Library() {
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const setQueue = usePlayerStore(s => s.setQueue)
  const { playTrack } = usePlayerContext() || {}
  const addToast = useToastStore(s => s.addToast)

  const loadLibrary = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('library').select('*').order('added_at', { ascending: false })
    if (!error) setSongs(data || [])
    setLoading(false)
  }

  useEffect(() => { loadLibrary() }, [])

  const handleDelete = async (videoId) => {
    const { error } = await supabase.from('library').delete().eq('video_id', videoId)
    if (!error) { setSongs(prev => prev.filter(s => s.video_id !== videoId)); addToast('Removed from library') }
  }

  const handlePlayAll = () => {
    if (!songs.length) return
    const queue = songs.map(s => ({ videoId: s.video_id, title: s.title, channel: s.channel, thumbnail: s.thumbnail, duration: s.duration }))
    if (playTrack) playTrack(queue[0], queue, 0)
    else setQueue(queue, 0)
  }

  if (loading) return (
    <div className="px-4 sm:px-6 md:px-8 py-6 md:py-8">
      <div className="skeleton h-9 w-36 rounded-xl mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl p-3">
            <div className="skeleton aspect-video rounded-xl mb-3" />
            <div className="skeleton h-3.5 rounded mb-2" />
            <div className="skeleton h-3 rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="px-4 sm:px-6 md:px-8 py-6 md:py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5 md:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #a78bfa, #818cf8)' }}>
              <LibraryIcon size={16} color="white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Library</h1>
              <p className="text-xs md:text-sm" style={{ color: 'var(--text-muted)' }}>{songs.length} saved songs</p>
            </div>
          </div>
          {songs.length > 0 && (
            <button onClick={handlePlayAll} className="btn-accent px-4 py-2 md:px-5 md:py-2.5 rounded-xl text-xs md:text-sm font-semibold flex items-center gap-1.5 md:gap-2">
              <Play size={14} fill="white" />
              Play All
            </button>
          )}
        </div>

        {songs.length === 0 ? (
          <div className="text-center py-20 md:py-24">
            <p className="text-5xl md:text-6xl mb-4">💿</p>
            <p className="text-lg md:text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Library is empty</p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Save songs from Search to build your collection</p>
            <a href="/search" className="btn-accent px-5 py-2.5 rounded-xl text-sm font-semibold inline-block">Find Music</a>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {songs.map((song, i) => {
              const queue = songs.map(s => ({ videoId: s.video_id, title: s.title, channel: s.channel, thumbnail: s.thumbnail, duration: s.duration }))
              return (
                <motion.div key={song.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                  className="song-card glass rounded-2xl overflow-hidden cursor-pointer group"
                  onClick={() => {
                    if (playTrack) playTrack(queue[i], queue, i)
                    else setQueue(queue, i)
                  }}>
                  <div className="relative aspect-video overflow-hidden">
                    <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300" style={{ background: 'rgba(10,10,15,0.6)' }}>
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #a78bfa, #818cf8)' }}>
                        <Play size={18} fill="white" color="white" style={{ marginLeft: 2 }} />
                      </div>
                    </div>
                  </div>
                  <div className="p-2.5 md:p-3">
                    <h3 className="text-xs md:text-sm font-semibold line-clamp-2 mb-1" style={{ color: 'var(--text-primary)' }}>{song.title}</h3>
                    <p className="text-[10px] md:text-xs truncate mb-2 md:mb-3" style={{ color: 'var(--text-muted)' }}>{song.channel}</p>
                    <button className="flex items-center gap-1 text-[10px] md:text-xs transition-all hover:scale-105" style={{ color: '#f87171' }}
                      onClick={(e) => { e.stopPropagation(); handleDelete(song.video_id) }}>
                      <Trash2 size={11} /> Remove
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>
    </div>
  )
}
