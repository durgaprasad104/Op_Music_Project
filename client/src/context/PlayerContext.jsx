import { createContext, useContext, useEffect, useRef } from 'react'
import { usePlayerStore } from '../store/store'

const PlayerContext = createContext(null)

// ─── Module-level state ──────────────────────────────────────────────────────
// IMPORTANT: These live at module scope so they survive React re-renders.
// BUT Vite HMR resets them on every hot-reload while window.YT persists.
// We therefore derive initial state from window rather than hard-coding false/null.

let ytPlayer = null
let ytApiReady = !!(window.YT && window.YT.Player)   // ← HMR-safe check
let initQueue = []

// ─── YouTube IFrame API bootstrap ────────────────────────────────────────────

function loadYTApi() {
  // If YT is already loaded (e.g. after an HMR cycle) mark ready and bail out.
  if (window.YT && window.YT.Player) {
    ytApiReady = true
    return
  }
  // Avoid injecting the script more than once across HMR cycles.
  if (document.getElementById('yt-iframe-api')) return

  const tag = document.createElement('script')
  tag.id = 'yt-iframe-api'
  tag.src = 'https://www.youtube.com/iframe_api'
  document.head.appendChild(tag)
}

// This fires once per full page-load. HMR doesn't re-run it.
window.onYouTubeIframeAPIReady = () => {
  ytApiReady = true
  initQueue.forEach(fn => fn())
  initQueue = []
}

// ─── Helpers (module-level so they share ytPlayer without closures) ───────────

/** Re-apply current volume/mute state to the live player. */
function applyVolume() {
  if (!ytPlayer) return
  const { volume, isMuted } = usePlayerStore.getState()
  try {
    if (isMuted) {
      ytPlayer.mute()
    } else {
      ytPlayer.unMute()
      ytPlayer.setVolume(volume)
    }
  } catch (_) {}
}

let isInitialLoad = true
let lastLoadedVideoId = null

/**
 * Load a video.  Always mutes first on the *initial load* (satisfies Chrome autoplay policy),
 * then immediately re-applies the real volume. On subsequent loads (e.g. queue auto-advance), 
 * it avoids muting to prevent 'unMute' from failing when outside a user-gesture context.
 */
function doLoadVideo(videoId) {
  if (!ytPlayer || lastLoadedVideoId === videoId) return
  lastLoadedVideoId = videoId
  
  try {
    if (isInitialLoad) {
      ytPlayer.mute()
      isInitialLoad = false
    }
    ytPlayer.loadVideoById({ videoId, startSeconds: 0 })
    // Explicitly call playVideo to force it on mobile browsers requiring a gesture
    ytPlayer.playVideo()
    // Synchronous — still inside the original click-event call stack.
    applyVolume()
  } catch (_) {}
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function PlayerProvider({ children }) {
  const containerRef = useRef(null)
  const progressTimer = useRef(null)
  const {
    currentTrack, isPlaying, volume, isMuted,
    setIsPlaying, setProgress, setDuration, setPlayerReady, playNext
  } = usePlayerStore()

  // ── 1. Bootstrap the YT IFrame API ─────────────────────────────────────
  useEffect(() => {
    loadYTApi()
  }, [])

  // ── 2. Create (or re-create after HMR) the hidden YT Player ────────────
  useEffect(() => {
    const initPlayer = () => {
      if (!containerRef.current) return

      // Destroy any stale player left over from an HMR cycle.
      if (ytPlayer) {
        try { ytPlayer.destroy() } catch (_) {}
        ytPlayer = null
      }

      ytPlayer = new window.YT.Player(containerRef.current, {
        height: '200',
        width: '200',
        playerVars: {
          autoplay:       1,
          controls:       0,
          disablekb:      1,
          fs:             0,
          rel:            0,
          modestbranding: 1,
          playsinline:    1,
          enablejsapi:    1,
          // Start every session muted so Chrome's autoplay policy never blocks
          // the initial load.  We unmute manually right after buffering begins.
          mute:           1,
          origin:         window.location.origin,
          widget_referrer: window.location.origin,
        },
        events: {
          onReady: (e) => {
            setPlayerReady(true)

            // Patch the allow attribute on the iframe the YT API just created.
            // Feature Policy is checked each time playback starts, so backfilling
            // works for all future plays even though it's set after first navigation.
            try {
              const iframe = e.target.getIframe()
              if (iframe) {
                iframe.setAttribute(
                  'allow',
                  'autoplay; encrypted-media; fullscreen; picture-in-picture'
                )
                iframe.removeAttribute('allowfullscreen')
              }
            } catch (_) {}

            // If a track was already selected before the player was ready
            // (can happen if clicks arrived during YT script load), play it now.
            const track = usePlayerStore.getState().currentTrack
            if (track) doLoadVideo(track.videoId)
          },

          onStateChange: (e) => {
            const YT = window.YT.PlayerState

            // BUFFERING fires immediately after loadVideoById — we're still very
            // close to the originating user gesture here: safest time to unmute.
            if (e.data === YT.BUFFERING || e.data === YT.PLAYING) {
              applyVolume()
            }

            if (e.data === YT.PLAYING) {
              setIsPlaying(true)
              try { setDuration(e.target.getDuration()) } catch (_) {}
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

          onError: () => { setIsPlaying(false); playNext() },
        },
      })
    }

    // If the API is already loaded (normal page load OR after HMR) run now.
    // Otherwise queue for when the API script fires its callback.
    if (ytApiReady) {
      initPlayer()
    } else {
      initQueue.push(initPlayer)
    }

    return () => stopProgress()
  }, [])

  // ── 3. Track-change fallback ────────────────────────────────────────────
  // Catches changes that didn't go through playTrack() — next/prev, queue
  // auto-advance, and any other store-level setCurrentTrack calls.
  useEffect(() => {
    if (!currentTrack || !ytPlayer) return
    doLoadVideo(currentTrack.videoId)
  }, [currentTrack?.videoId])

  // ── 4. Play / pause sync ───────────────────────────────────────────────
  useEffect(() => {
    if (!ytPlayer) return
    if (isPlaying) {
      applyVolume()
      try { ytPlayer.playVideo() } catch (_) {}
      startProgress(ytPlayer)
    } else {
      try { ytPlayer.pauseVideo() } catch (_) {}
      stopProgress()
    }
  }, [isPlaying])

  // ── 5. Volume / mute sync ──────────────────────────────────────────────
  useEffect(() => { applyVolume() }, [volume, isMuted])

  // ── 6. Keyboard shortcuts ──────────────────────────────────────────────
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

  // ── Progress tracking ──────────────────────────────────────────────────
  const startProgress = (player = ytPlayer) => {
    stopProgress()
    progressTimer.current = setInterval(() => {
      try {
        if (player && typeof player.getCurrentTime === 'function') {
          setProgress(player.getCurrentTime())
          setDuration(player.getDuration() || 0)
        }
      } catch (_) {}
    }, 500)
  }

  const stopProgress = () => {
    clearInterval(progressTimer.current)
    progressTimer.current = null
  }

  // ── Public context API ─────────────────────────────────────────────────

  const seekTo = (seconds) => {
    try { ytPlayer?.seekTo?.(seconds, true) } catch (_) {}
    setProgress(seconds)
  }

  /**
   * The PRIMARY way to start playing a track.
   * Call directly from onClick so the YouTube API calls (mute/loadVideoById/
   * unMute) execute synchronously within the browser's user-gesture context.
   * Chrome requires this to allow unmuted autoplay in cross-origin iframes.
   */
  const playTrack = (track, queue = [], startIndex = 0) => {
    const store = usePlayerStore.getState()
    if (queue.length > 0) {
      store.setQueue(queue, startIndex)
    } else {
      store.setCurrentTrack(track)
    }
    const target = queue.length > 0 ? queue[startIndex] : track
    if (target && ytPlayer) doLoadVideo(target.videoId)
  }

  const togglePlay = () => {
    const { isPlaying, setIsPlaying } = usePlayerStore.getState()
    if (!isPlaying) applyVolume()   // ensure unmuted on resume
    setIsPlaying(!isPlaying)
  }

  const playNextTrack = async () => {
    const store = usePlayerStore.getState()
    const { queue, queueIndex } = store
    
    // If we have the next track, load it synchronously to bypass autoplay constraints
    if (queueIndex + 1 < queue.length) {
      const nextTrack = queue[queueIndex + 1]
      if (nextTrack && ytPlayer) doLoadVideo(nextTrack.videoId)
    }
    
    // Let the store handle state updates or fetching if at end of queue
    await store.playNext()
    
    // Just in case it fetched a new track that wasn't loaded synchronously
    const newTrack = usePlayerStore.getState().currentTrack
    if (newTrack && ytPlayer && newTrack.videoId !== lastLoadedVideoId) {
      doLoadVideo(newTrack.videoId)
    }
  }

  const playPrevTrack = () => {
    const store = usePlayerStore.getState()
    const { queue, queueIndex } = store
    
    if (queueIndex - 1 >= 0) {
      const prevTrack = queue[queueIndex - 1]
      if (prevTrack && ytPlayer) doLoadVideo(prevTrack.videoId)
    }
    
    store.playPrev()
  }

  return (
    <PlayerContext.Provider value={{ seekTo, playTrack, togglePlay, playNextTrack, playPrevTrack }}>
      {children}
      {/*
        Hidden YT player container.
        Rules:
        · Must be a <div> — passing a pre-built <iframe> to new YT.Player()
          fails silently; the API creates its own iframe inside a <div>.
        · Must stay in-viewport (top-left corner): YouTube's IntersectionObserver
          auto-mutes off-screen iframes (position:fixed keeps it on-screen).
        · opacity near-zero (not 0) keeps it technically visible to the browser.
        · pointerEvents:none prevents accidental click capture.
      */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 210,
          height: 210,
          opacity: 0.001,
          pointerEvents: 'none',
          zIndex: -100,
          overflow: 'hidden',
        }}
      >
        <div ref={containerRef} />
      </div>
    </PlayerContext.Provider>
  )
}

export const usePlayerContext = () => useContext(PlayerContext)
