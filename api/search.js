const axios = require('axios')

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const YOUTUBE_BASE = 'https://www.googleapis.com/youtube/v3'

function parseDuration(iso) {
  if (!iso) return '0:00'
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return '0:00'
  const h = parseInt(match[1] || 0)
  const m = parseInt(match[2] || 0)
  const s = parseInt(match[3] || 0)
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return `${m}:${String(s).padStart(2,'0')}`
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { q, maxResults = 12, pageToken } = req.query
  if (!q) return res.status(400).json({ error: 'Query required' })
  if (!YOUTUBE_API_KEY) return res.status(503).json({ error: 'YouTube API key not configured' })

  try {
    const searchRes = await axios.get(`${YOUTUBE_BASE}/search`, {
      params: { part: 'snippet', q, type: 'video', maxResults, pageToken: pageToken || undefined, videoCategoryId: '10', key: YOUTUBE_API_KEY }
    })

    const items = searchRes.data.items
    const videoIds = items.map(i => i.id.videoId).join(',')

    const detailsRes = await axios.get(`${YOUTUBE_BASE}/videos`, {
      params: { part: 'contentDetails,statistics', id: videoIds, key: YOUTUBE_API_KEY }
    })

    const detailsMap = {}
    detailsRes.data.items.forEach(v => {
      detailsMap[v.id] = { duration: parseDuration(v.contentDetails.duration), viewCount: v.statistics?.viewCount }
    })

    const results = items.map(item => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
      publishedAt: item.snippet.publishedAt,
      ...detailsMap[item.id.videoId]
    }))

    res.json({ results, nextPageToken: searchRes.data.nextPageToken || null, totalResults: searchRes.data.pageInfo?.totalResults })
  } catch (err) {
    console.error('Search error:', err.response?.data || err.message)
    res.status(500).json({ error: err.response?.data?.error?.message || 'Search failed' })
  }
}
