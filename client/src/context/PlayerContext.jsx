import { createContext, useContext, useEffect, useRef } from 'react'
import { usePlayerStore } from '../store/store'

const PlayerContext = createContext(null)

let ytPlayer = null
let ytApiReady = false
let initQueue = []

// Load YouTube IFrame API once
function loadYTApi() {
  if (window.YT || document.getElementById('yt-iframe-api')) return
  const tag = document.createElement('script')
  tag.id = 'yt-iframe-api'
  tag.src = 'https://www.youtube.com/iframe_api'
  document.head.appendChild(tag)
}

window.onYouTubeIframeAPIReady = () => {
  ytApiReady = true
  initQueue.forEach(fn => fn())
  initQueue = []
}

export function PlayerProvider({ children }) {
  const containerRef = useRef(null)
  const progressTimer = useRef(null)
  const {
    currentTrack, isPlaying, volume, isMuted,
    setIsPlaying, setProgress, setDuration, setPlayerReady, playNext
  } = usePlayerStore()

  // Init YouTube API
  useEffect(() => {
    loadYTApi()
  }, [])

  // Create player container
  useEffect(() => {
    const initPlayer = () => {
      if (!containerRef.current) return
      ytPlayer = new window.YT.Player(containerRef.current, {
        host: 'https://www.youtube.com',
        height: '200',
        width: '200',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin
        },
        events: {
          onReady: (e) => {
            setPlayerReady(true)
            // The YT API object (e.target) is guaranteed to have the methods,
            // whereas the `ytPlayer` reference might still be initializing.
            if (e.target && e.target.setVolume) {
              e.target.setVolume(usePlayerStore.getState().volume)
            } else if (ytPlayer && ytPlayer.setVolume) {
              ytPlayer.setVolume(usePlayerStore.getState().volume)
            }
          },
          onStateChange: (e) => {
            const YT = window.YT.PlayerState
            if (e.data === YT.PLAYING) {
              setIsPlaying(true)
              if (e.target && e.target.getDuration) {
                setDuration(e.target.getDuration())
              }
              startProgress(e.target)
            } else if (e.data === YT.PAUSED) {
              setIsPlaying(false)
              stopProgress()
            } else if (e.data === YT.ENDED) {
              stopProgress()
              setProgress(0)
              playNext()
            }
          },
          onError: () => {
            setIsPlaying(false)
            playNext()
          }
        }
      })
    }

    if (ytApiReady) {
      initPlayer()
    } else {
      initQueue.push(initPlayer)
    }

    return () => {
      stopProgress()
    }
  }, [])

  // Track change → load video
  useEffect(() => {
    if (!currentTrack || !ytPlayer) return
    const tryLoad = () => {
      if (ytPlayer && ytPlayer.loadVideoById) {
        ytPlayer.loadVideoById(currentTrack.videoId)
      } else {
        setTimeout(tryLoad, 500)
      }
    }
    tryLoad()
  }, [currentTrack?.videoId])

  // Play/pause sync
  useEffect(() => {
    if (!ytPlayer) return
    if (isPlaying) {
      if (typeof ytPlayer.playVideo === 'function') {
        ytPlayer.playVideo()
        startProgress(ytPlayer)
      }
    } else {
      if (typeof ytPlayer.pauseVideo === 'function') {
        ytPlayer.pauseVideo()
        stopProgress()
      }
    }
  }, [isPlaying])

  // Volume sync
  useEffect(() => {
    if (!ytPlayer) return
    if (isMuted) {
      if (typeof ytPlayer.mute === 'function') ytPlayer.mute()
    } else {
      if (typeof ytPlayer.unMute === 'function') ytPlayer.unMute()
      if (typeof ytPlayer.setVolume === 'function') ytPlayer.setVolume(volume)
    }
  }, [volume, isMuted])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const tag = e.target.tagName.toLowerCase()
      if (tag === 'input' || tag === 'textarea') return

      if (e.code === 'Space') {
        e.preventDefault()
        const { isPlaying, setIsPlaying } = usePlayerStore.getState()
        setIsPlaying(!isPlaying)
      } else if (e.code === 'ArrowRight' && e.altKey) {
        usePlayerStore.getState().playNext()
      } else if (e.code === 'ArrowLeft' && e.altKey) {
        usePlayerStore.getState().playPrev()
      } else if (e.code === 'KeyM') {
        const { isMuted, setMuted } = usePlayerStore.getState()
        setMuted(!isMuted)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const startProgress = (player = ytPlayer) => {
    stopProgress()
    progressTimer.current = setInterval(() => {
      if (player && typeof player.getCurrentTime === 'function') {
        setProgress(player.getCurrentTime())
        if (typeof player.getDuration === 'function') {
          setDuration(player.getDuration() || 0)
        }
      }
    }, 500)
  }

  const stopProgress = () => {
    clearInterval(progressTimer.current)
    progressTimer.current = null
  }

  const seekTo = (seconds) => {
    ytPlayer?.seekTo?.(seconds, true)
    setProgress(seconds)
  }

  return (
    <PlayerContext.Provider value={{ seekTo }}>
      {children}
      {/* Hidden YouTube IFrame - Must be technically visible to avoid browser auto-muting */}
      <div
        style={{
          position: 'fixed',
          top: -2000,
          left: -2000,
          width: 200,
          height: 200,
          pointerEvents: 'none',
          zIndex: -1,
          clipPath: 'inset(50%)'
        }}
        aria-hidden
      >
        <div ref={containerRef} />
      </div>
    </PlayerContext.Provider>
  )
}

export const usePlayerContext = () => useContext(PlayerContext)
