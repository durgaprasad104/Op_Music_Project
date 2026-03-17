import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search as SearchIcon, X, Loader2 } from 'lucide-react'
import SongCard from '../components/UI/SongCard'
import SkeletonCard from '../components/UI/SkeletonCard'

function useDebounce(val, delay) {
  const [debounced, setDebounced] = useState(val)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(val), delay)
    return () => clearTimeout(t)
  }, [val, delay])
  return debounced
}

export default function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [nextPageToken, setNextPageToken] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const inputRef = useRef(null)
  const debouncedQuery = useDebounce(query, 400)

  const fetchResults = useCallback(async (q, pageToken = null, append = false) => {
    if (!q.trim()) { setResults([]); return }
    if (append) setLoadingMore(true); else setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ q, maxResults: 12 })
      if (pageToken) params.set('pageToken', pageToken)
      const res = await fetch(`/api/search?${params}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResults(prev => append ? [...prev, ...(data.results || [])] : (data.results || []))
      setNextPageToken(data.nextPageToken || null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => { setNextPageToken(null); fetchResults(debouncedQuery) }, [debouncedQuery])
  useEffect(() => { inputRef.current?.focus() }, [])

  return (
    <div className="px-4 sm:px-6 md:px-8 py-6 md:py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold mb-5 md:mb-6" style={{ color: 'var(--text-primary)' }}>Search</h1>

        {/* Search Input */}
        <div className="relative mb-6 md:mb-8">
          <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search songs, artists..."
            className="input-glass w-full py-3.5 md:py-4 pl-11 pr-10 rounded-2xl text-sm md:text-base"
          />
          {query && (
            <button className="absolute right-4 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity" onClick={() => setQuery('')}>
              <X size={16} style={{ color: 'var(--text-muted)' }} />
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="glass rounded-xl p-4 mb-5 border" style={{ borderColor: 'rgba(248,113,113,0.3)' }}>
            <p className="text-sm" style={{ color: '#f87171' }}>⚠️ {error}</p>
            {error.includes('API key') && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Add your YouTube Data API key to <code>server/.env</code>
              </p>
            )}
          </div>
        )}

        {/* Results */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            </motion.div>
          ) : results.length > 0 ? (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-xs md:text-sm mb-3 md:mb-4" style={{ color: 'var(--text-muted)' }}>
                Results for "<strong style={{ color: 'var(--text-secondary)' }}>{debouncedQuery}</strong>"
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {results.map((track, i) => (
                  <motion.div key={`${track.videoId}-${i}`} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: (i % 12) * 0.03 }}>
                    <SongCard track={track} queue={results} queueIndex={i} />
                  </motion.div>
                ))}
              </div>
              {nextPageToken && (
                <div className="text-center mt-8">
                  <button onClick={() => fetchResults(debouncedQuery, nextPageToken, true)} disabled={loadingMore}
                    className="btn-accent px-6 py-3 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center gap-2 mx-auto">
                    {loadingMore && <Loader2 size={15} className="animate-spin" />}
                    {loadingMore ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </motion.div>
          ) : query && !loading ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>No results found</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Try a different search term</p>
            </motion.div>
          ) : !query ? (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <p className="text-5xl mb-4">🎶</p>
              <p className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Discover Music</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Type anything to search YouTube for music</p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
