import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const usePlayerStore = create(
  persist(
    (set, get) => ({
      user: null, // { name: '', phone: '' }
      currentTrack: null,
      isPlaying: false,
      queue: [],
      queueIndex: 0,
      volume: 80,
      isMuted: false,
      progress: 0,
      duration: 0,
      recentlyPlayed: [],
      playerReady: false,
      detailTrack: null,
      isDetailOpen: false,

      loginUser: (name, phone) => set({ user: { name, phone } }),
      logoutUser: () => set({ user: null }),

      setCurrentTrack: (track) => {
        const recent = get().recentlyPlayed.filter(r => r.videoId !== track.videoId)
        set({
          currentTrack: track,
          isPlaying: true,
          recentlyPlayed: [track, ...recent].slice(0, 20)
        })
      },

      setQueue: (tracks, startIndex = 0) => {
        set({ queue: tracks, queueIndex: startIndex })
        if (tracks[startIndex]) get().setCurrentTrack(tracks[startIndex])
      },

      addToQueue: (track) => set(s => ({ queue: [...s.queue, track] })),

      setIsPlaying: (val) => set({ isPlaying: val }),
      setVolume: (vol) => set({ volume: vol, isMuted: false }),
      setMuted: (val) => set({ isMuted: val }),
      setProgress: (p) => set({ progress: p }),
      setDuration: (d) => set({ duration: d }),
      setPlayerReady: (val) => set({ playerReady: val }),
      setDetailTrack: (track) => {
        console.log('setDetailTrack called with:', track?.title)
        set({ detailTrack: track, isDetailOpen: !!track })
      },
      closeDetail: () => set({ isDetailOpen: false }),

      playNext: async () => {
        const { queue, queueIndex } = get()
        const nextIndex = queueIndex + 1
        
        if (nextIndex < queue.length) {
          set({ queueIndex: nextIndex })
          get().setCurrentTrack(queue[nextIndex])
        } else if (queue.length > 0) {
          // Reached the end of the queue. Fetch related songs.
          try {
            const current = queue[queueIndex]
            const params = `videoId=${current.videoId}&q=${encodeURIComponent(current.title)}`
            const res = await fetch(`/api/recommendations?${params}`)
            const data = await res.json()
            
            if (data.results && data.results.length > 0) {
              // Append to the queue, but avoid adding duplicate of the current track immediately
              const newTracks = data.results.filter(t => t.videoId !== current.videoId)
              if (newTracks.length > 0) {
                const newQueue = [...queue, ...newTracks]
                set({ queue: newQueue, queueIndex: nextIndex })
                get().setCurrentTrack(newTracks[0])
              } else {
                 set({ isPlaying: false })
              }
            } else {
              set({ isPlaying: false })
            }
          } catch (e) {
            console.error('Failed to fetch next songs for autoplay:', e)
            set({ isPlaying: false })
          }
        } else {
          set({ isPlaying: false })
        }
      },

      playPrev: () => {
        const { queue, queueIndex } = get()
        const prevIndex = queueIndex - 1
        if (prevIndex >= 0) {
          set({ queueIndex: prevIndex })
          get().setCurrentTrack(queue[prevIndex])
        }
      },

      clearRecentlyPlayed: () => set({ recentlyPlayed: [] })
    }),
    {
      name: 'op-music-player',
      partialize: (state) => ({
        user: state.user,
        volume: state.volume,
        recentlyPlayed: state.recentlyPlayed
      })
    }
  )
)

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'dark',
      toggleTheme: () => set(s => {
        const next = s.theme === 'dark' ? 'light' : 'dark'
        document.documentElement.setAttribute('data-theme', next)
        return { theme: next }
      }),
      initTheme: () => {
        const theme = useThemeStore.getState().theme
        document.documentElement.setAttribute('data-theme', theme)
      }
    }),
    { name: 'op-music-theme' }
  )
)

export const useToastStore = create((set) => ({
  toasts: [],
  addToast: (message, type = 'success') => {
    const id = Date.now()
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => {
      set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }))
    }, 3000)
  }
}))
