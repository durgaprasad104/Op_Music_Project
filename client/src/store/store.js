import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const usePlayerStore = create(
  persist(
    (set, get) => ({
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

      playNext: () => {
        const { queue, queueIndex } = get()
        const nextIndex = queueIndex + 1
        if (nextIndex < queue.length) {
          set({ queueIndex: nextIndex })
          get().setCurrentTrack(queue[nextIndex])
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
