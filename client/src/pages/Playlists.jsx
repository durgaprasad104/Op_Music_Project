import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ListMusic, Plus, Trash2, ChevronRight, Play, X, Music, ChevronLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { usePlayerStore, useToastStore } from '../store/store'

export default function Playlists() {
  const [playlists, setPlaylists] = useState([])
  const [selectedPlaylist, setSelectedPlaylist] = useState(null)
  const [playlistSongs, setPlaylistSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  // Mobile: show song panel over playlist panel
  const [showSongs, setShowSongs] = useState(false)
  const setQueue = usePlayerStore(s => s.setQueue)
  const addToast = useToastStore(s => s.addToast)

  const loadPlaylists = async () => {
    const { data } = await supabase.from('playlists').select('*').order('created_at', { ascending: false })
    setPlaylists(data || [])
    setLoading(false)
  }

  const loadPlaylistSongs = async (playlistId) => {
    const { data } = await supabase.from('playlist_songs').select('*').eq('playlist_id', playlistId).order('added_at', { ascending: true })
    setPlaylistSongs(data || [])
  }

  useEffect(() => { loadPlaylists() }, [])

  const handleSelectPlaylist = (pl) => {
    setSelectedPlaylist(pl)
    loadPlaylistSongs(pl.id)
    setShowSongs(true) // on mobile, navigate to song panel
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    const { data, error } = await supabase.from('playlists').insert({ name: newName.trim() }).select()
    if (!error && data) { setPlaylists(prev => [data[0], ...prev]); setNewName(''); setCreating(false); addToast('Playlist created 🎵') }
  }

  const handleDeletePlaylist = async (id) => {
    await supabase.from('playlists').delete().eq('id', id)
    setPlaylists(prev => prev.filter(p => p.id !== id))
    if (selectedPlaylist?.id === id) { setSelectedPlaylist(null); setShowSongs(false) }
    addToast('Playlist deleted')
  }

  const handleRemoveSong = async (songId) => {
    await supabase.from('playlist_songs').delete().eq('id', songId)
    setPlaylistSongs(prev => prev.filter(s => s.id !== songId))
  }

  const handlePlayPlaylist = () => {
    if (!playlistSongs.length) return
    setQueue(playlistSongs.map(s => ({ videoId: s.video_id, title: s.title, channel: s.channel, thumbnail: s.thumbnail, duration: s.duration })), 0)
  }

  return (
    <div className="px-4 sm:px-6 md:px-8 py-6 md:py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5 md:mb-6">
          <div className="flex items-center gap-3">
            {/* Back button on mobile when viewing songs */}
            {showSongs && (
              <button onClick={() => setShowSongs(false)} className="md:hidden p-2 rounded-xl glass-hover mr-1">
                <ChevronLeft size={18} style={{ color: 'var(--text-secondary)' }} />
              </button>
            )}
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #a78bfa, #818cf8)' }}>
              <ListMusic size={16} color="white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {showSongs && selectedPlaylist ? selectedPlaylist.name : 'Playlists'}
            </h1>
          </div>
          {!showSongs && (
            <button onClick={() => setCreating(true)} className="btn-accent px-3 py-2 md:px-5 md:py-2.5 rounded-xl text-xs md:text-sm font-semibold flex items-center gap-1.5 md:gap-2">
              <Plus size={14} /> New
            </button>
          )}
          {showSongs && playlistSongs.length > 0 && (
            <button onClick={handlePlayPlaylist} className="btn-accent px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 md:hidden">
              <Play size={12} fill="white" /> Play
            </button>
          )}
        </div>

        {/* Create form */}
        <AnimatePresence>
          {creating && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="glass rounded-2xl p-4 md:p-5 mb-5 overflow-hidden">
              <h3 className="font-semibold text-sm md:text-base mb-3" style={{ color: 'var(--text-primary)' }}>New Playlist</h3>
              <div className="flex gap-2 md:gap-3">
                <input autoFocus type="text" value={newName} onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  placeholder="Playlist name..." className="input-glass flex-1 rounded-xl px-3 py-2.5 text-sm" />
                <button onClick={handleCreate} className="btn-accent px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap">Create</button>
                <button onClick={() => setCreating(false)} className="p-2.5 rounded-xl glass-hover"><X size={16} style={{ color: 'var(--text-muted)' }} /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Mobile: show one panel at a time ─── */}
        <div className="md:hidden">
          {!showSongs ? (
            /* Playlist list */
            loading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton rounded-xl h-14 mb-3" />) :
            playlists.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">🎵</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No playlists yet</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {playlists.map(pl => (
                  <motion.li key={pl.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="flex items-center justify-between p-3.5 rounded-xl cursor-pointer glass glass-hover transition-all" onClick={() => handleSelectPlaylist(pl)}>
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(167,139,250,0.15)' }}>
                          <Music size={14} style={{ color: 'var(--accent)' }} />
                        </div>
                        <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{pl.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={e => { e.stopPropagation(); handleDeletePlaylist(pl.id) }} className="p-1.5 rounded-lg transition-all">
                          <Trash2 size={13} style={{ color: '#f87171' }} />
                        </button>
                        <ChevronRight size={15} style={{ color: 'var(--text-muted)' }} />
                      </div>
                    </div>
                  </motion.li>
                ))}
              </ul>
            )
          ) : (
            /* Song list on mobile */
            <div>
              {/* Desktop play all already handled, mobile play at top */}
              {playlistSongs.length === 0 ? (
                <div className="glass rounded-2xl p-8 text-center mt-2">
                  <p className="text-3xl mb-3">🎵</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No songs. Add from Search or Library.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {playlistSongs.map((song, i) => (
                    <motion.div key={song.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      className="glass glass-hover rounded-xl flex items-center gap-3 p-3 cursor-pointer group"
                      onClick={() => { const tracks = playlistSongs.map(s => ({ videoId: s.video_id, title: s.title, channel: s.channel, thumbnail: s.thumbnail, duration: s.duration })); setQueue(tracks, i) }}>
                      <span className="text-xs w-4 text-center flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
                      <img src={song.thumbnail} alt={song.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{song.title}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{song.channel}</p>
                      </div>
                      <button onClick={e => { e.stopPropagation(); handleRemoveSong(song.id) }} className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100">
                        <X size={13} style={{ color: '#f87171' }} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Desktop: two-panel ─── */}
        <div className="hidden md:grid grid-cols-3 gap-6">
          {/* Playlist list */}
          <div className="col-span-1">
            {loading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton rounded-xl h-16 mb-3" />) :
             playlists.length === 0 ? (
              <div className="text-center py-12"><p className="text-4xl mb-3">🎵</p><p className="text-sm" style={{ color: 'var(--text-muted)' }}>No playlists yet</p></div>
            ) : (
              <ul className="space-y-2">
                {playlists.map(pl => (
                  <motion.li key={pl.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                    <div className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all glass-hover ${selectedPlaylist?.id === pl.id ? 'nav-item-active' : 'glass'}`} onClick={() => handleSelectPlaylist(pl)}>
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(167,139,250,0.15)' }}>
                          <Music size={16} style={{ color: 'var(--accent)' }} />
                        </div>
                        <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{pl.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={e => { e.stopPropagation(); handleDeletePlaylist(pl.id) }} className="p-1.5 rounded-lg hover:opacity-100 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 size={14} style={{ color: '#f87171' }} />
                        </button>
                        <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                      </div>
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>

          {/* Song detail */}
          <div className="col-span-2">
            {selectedPlaylist ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{selectedPlaylist.name}</h2>
                  {playlistSongs.length > 0 && (
                    <button onClick={handlePlayPlaylist} className="btn-accent px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
                      <Play size={14} fill="white" /> Play All
                    </button>
                  )}
                </div>
                {playlistSongs.length === 0 ? (
                  <div className="glass rounded-2xl p-8 text-center"><p className="text-4xl mb-3">🎵</p><p className="text-sm" style={{ color: 'var(--text-muted)' }}>No songs. Add from Search or Library.</p></div>
                ) : (
                  <div className="space-y-2">
                    {playlistSongs.map((song, i) => (
                      <motion.div key={song.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        className="glass glass-hover rounded-xl flex items-center gap-3 p-3 cursor-pointer group"
                        onClick={() => { const tracks = playlistSongs.map(s => ({ videoId: s.video_id, title: s.title, channel: s.channel, thumbnail: s.thumbnail, duration: s.duration })); setQueue(tracks, i) }}>
                        <span className="text-xs w-5 text-center flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
                        <img src={song.thumbnail} alt={song.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        <div className="flex-1 overflow-hidden">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{song.title}</p>
                          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{song.channel}</p>
                        </div>
                        <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{song.duration}</span>
                        <button onClick={e => { e.stopPropagation(); handleRemoveSong(song.id) }} className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100">
                          <X size={14} style={{ color: '#f87171' }} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="glass rounded-2xl p-12 text-center flex flex-col items-center justify-center" style={{ minHeight: 300 }}>
                <p className="text-5xl mb-4">👈</p>
                <p className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Select a playlist</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>or create a new one</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
