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
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { videoId, q } = req.query
  if (!YOUTUBE_API_KEY) return res.status(503).json({ error: 'YouTube API key not configured' })

  try {
    let items = []
    const searchQuery = q ? q + ' song related' : 'popular hit music 2024'

    const searchRes = await axios.get(`${YOUTUBE_BASE}/search`, {
      params: { part: 'snippet', q: searchQuery, type: 'video', maxResults: 12, videoCategoryId: '10', key: YOUTUBE_API_KEY }
    })
    items = searchRes.data.items

    const videoIds = items.map(i => i.id?.videoId || i.id).filter(Boolean).join(',')
    let detailsMap = {}
    if (videoIds) {
      const detailsRes = await axios.get(`${YOUTUBE_BASE}/videos`, {
        params: { part: 'contentDetails', id: videoIds, key: YOUTUBE_API_KEY }
      })
      detailsRes.data.items.forEach(v => { detailsMap[v.id] = parseDuration(v.contentDetails.duration) })
    }

    const results = items
      .filter(item => item.id?.videoId || typeof item.id === 'string')
      .map(item => {
        const vid = item.id?.videoId || item.id
        return { videoId: vid, title: item.snippet.title, channel: item.snippet.channelTitle, thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url, duration: detailsMap[vid] || '0:00' }
      })

    res.json({ results })
  } catch (err) {
    console.error('Recommendations error:', err.response?.data || err.message)
    res.status(500).json({ error: 'Failed to fetch recommendations' })
  }
}
