require('dotenv').config();
const express = require('express');
const axios = require('axios');
const router = express.Router();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_BASE = 'https://www.googleapis.com/youtube/v3';

// Helper to parse ISO 8601 duration
function parseDuration(iso) {
  if (!iso) return '0:00';
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';
  const h = parseInt(match[1] || 0);
  const m = parseInt(match[2] || 0);
  const s = parseInt(match[3] || 0);
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${m}:${String(s).padStart(2,'0')}`;
}

// GET /api/search?q=query&maxResults=12&pageToken=...
router.get('/search', async (req, res) => {
  const { q, maxResults = 12, pageToken } = req.query;
  if (!q) return res.status(400).json({ error: 'Query required' });
  if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'your_youtube_data_api_v3_key_here') {
    return res.status(503).json({ error: 'YouTube API key not configured' });
  }

  try {
    // Search request
    const searchRes = await axios.get(`${YOUTUBE_BASE}/search`, {
      params: {
        part: 'snippet',
        q,
        type: 'video',
        maxResults,
        pageToken: pageToken || undefined,
        videoCategoryId: '10', // Music category
        key: YOUTUBE_API_KEY
      }
    });

    const items = searchRes.data.items;
    const videoIds = items.map(i => i.id.videoId).join(',');

    // Get video details (duration, views)
    const detailsRes = await axios.get(`${YOUTUBE_BASE}/videos`, {
      params: {
        part: 'contentDetails,statistics',
        id: videoIds,
        key: YOUTUBE_API_KEY
      }
    });

    const detailsMap = {};
    detailsRes.data.items.forEach(v => {
      detailsMap[v.id] = {
        duration: parseDuration(v.contentDetails.duration),
        viewCount: v.statistics?.viewCount
      };
    });

    const results = items.map(item => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
      publishedAt: item.snippet.publishedAt,
      ...detailsMap[item.id.videoId]
    }));

    res.json({
      results,
      nextPageToken: searchRes.data.nextPageToken || null,
      totalResults: searchRes.data.pageInfo?.totalResults
    });
  } catch (err) {
    console.error('YouTube search error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error?.message || 'Search failed' });
  }
});

// GET /api/video/:id - Video details
router.get('/video/:id', async (req, res) => {
  const { id } = req.params;
  if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'your_youtube_data_api_v3_key_here') {
    return res.status(503).json({ error: 'YouTube API key not configured' });
  }

  try {
    const detailsRes = await axios.get(`${YOUTUBE_BASE}/videos`, {
      params: {
        part: 'snippet,contentDetails,statistics',
        id,
        key: YOUTUBE_API_KEY
      }
    });

    const video = detailsRes.data.items[0];
    if (!video) return res.status(404).json({ error: 'Video not found' });

    res.json({
      videoId: video.id,
      title: video.snippet.title,
      channel: video.snippet.channelTitle,
      thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
      duration: parseDuration(video.contentDetails.duration),
      description: video.snippet.description,
      viewCount: video.statistics?.viewCount,
      likeCount: video.statistics?.likeCount
    });
  } catch (err) {
    console.error('YouTube video error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch video details' });
  }
});

// GET /api/recommendations?videoId=id&q=title
router.get('/recommendations', async (req, res) => {
  const { videoId, q } = req.query;
  if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'your_youtube_data_api_v3_key_here') {
    return res.status(503).json({ error: 'YouTube API key not configured' });
  }

  try {
    let items = [];

    if (q) {
      // YouTube deprecated 'relatedToVideoId' search in API v3.
      // Fallback: search using title keywords + music to simulate recommendations
      const searchRes = await axios.get(`${YOUTUBE_BASE}/search`, {
        params: {
          part: 'snippet',
          q: q + ' song related',
          type: 'video',
          maxResults: 12,
          videoCategoryId: '10',
          key: YOUTUBE_API_KEY
        }
      });
      items = searchRes.data.items;
    } else {
      // Default recommendations
      const searchRes = await axios.get(`${YOUTUBE_BASE}/search`, {
        params: {
          part: 'snippet',
          q: 'popular hit music 2024',
          type: 'video',
          maxResults: 12,
          videoCategoryId: '10',
          key: YOUTUBE_API_KEY
        }
      });
      items = searchRes.data.items;
    }

    // Get durations
    const videoIds = items.map(i => i.id?.videoId || i.id).filter(Boolean).join(',');
    let detailsMap = {};

    if (videoIds) {
      const detailsRes = await axios.get(`${YOUTUBE_BASE}/videos`, {
        params: { part: 'contentDetails', id: videoIds, key: YOUTUBE_API_KEY }
      });
      detailsRes.data.items.forEach(v => {
        detailsMap[v.id] = parseDuration(v.contentDetails.duration);
      });
    }

    const results = items
      .filter(item => item.id?.videoId || typeof item.id === 'string')
      .map(item => {
        const vid = item.id?.videoId || item.id;
        return {
          videoId: vid,
          title: item.snippet.title,
          channel: item.snippet.channelTitle,
          thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
          duration: detailsMap[vid] || '0:00'
        };
      });

    res.json({ results });
  } catch (err) {
    console.error('Recommendations error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

module.exports = router;
