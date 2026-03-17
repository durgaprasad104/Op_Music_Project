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

  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'Video ID required' })
  if (!YOUTUBE_API_KEY) return res.status(503).json({ error: 'YouTube API key not configured' })

  try {
    const detailsRes = await axios.get(`${YOUTUBE_BASE}/videos`, {
      params: { part: 'snippet,contentDetails,statistics', id, key: YOUTUBE_API_KEY }
    })
    const video = detailsRes.data.items[0]
    if (!video) return res.status(404).json({ error: 'Video not found' })
    res.json({
      videoId: video.id, title: video.snippet.title, channel: video.snippet.channelTitle,
      thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
      duration: parseDuration(video.contentDetails.duration),
      description: video.snippet.description, viewCount: video.statistics?.viewCount, likeCount: video.statistics?.likeCount
    })
  } catch (err) {
    console.error('Video error:', err.response?.data || err.message)
    res.status(500).json({ error: 'Failed to fetch video details' })
  }
}
