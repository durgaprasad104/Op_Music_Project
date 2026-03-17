require('dotenv').config();
const express = require('express');
const axios = require('axios');
const router = express.Router();

const YOUTUBE_API_KEY_ENV = process.env.YOUTUBE_API_KEY || '';
const YOUTUBE_BASE = 'https://www.googleapis.com/youtube/v3';

// Parse the environment variable into an array of keys (handles comma-separated lists)
const apiKeys = YOUTUBE_API_KEY_ENV.split(',')
  .map(k => k.trim())
  .filter(k => k.length > 0 && k !== 'your_youtube_data_api_v3_key_here');

let currentKeyIndex = 0;

/**
 * Wrapper for Axios GET requests to the YouTube API.
 * Automatically appends the current API key.
 * If a 403 quotaExceeded error occurs, it rotates to the next available key and retries.
 */
async function fetchWithRotation(endpoint, params) {
  if (apiKeys.length === 0) {
    throw new Error('No valid YouTube API keys configured');
  }

  let attempts = 0;
  
  while (attempts < apiKeys.length) {
    const key = apiKeys[currentKeyIndex];
    try {
      const response = await axios.get(`${YOUTUBE_BASE}${endpoint}`, {
        params: { ...params, key }
      });
      return response; // Success
    } catch (error) {
      const status = error.response?.status;
      const errorData = error.response?.data?.error;
      const isQuotaError = status === 403 && 
                           errorData?.errors?.some(e => e.reason === 'quotaExceeded' || e.reason === 'dailyLimitExceeded');

      if (isQuotaError) {
        console.warn(`⚠️ API Key [${currentKeyIndex}] quota exceeded! Switching to next key...`);
        // Rotate to the next key
        currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
        attempts++;
      } else {
        // Not a quota error, probably a bad request or generic networking issue. Throw it.
        throw error;
      }
    }
  }

  // If we broke out of the while loop, all keys are exhausted
  throw new Error('ALL_KEYS_EXHAUSTED');
}

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
  if (apiKeys.length === 0) {
    return res.status(503).json({ error: 'YouTube API keys not configured' });
  }

  try {
    // Search request
    const searchRes = await fetchWithRotation('/search', {
      part: 'snippet',
      q,
      type: 'video',
      maxResults,
      pageToken: pageToken || undefined,
      videoCategoryId: '10' // Music category
    });

    const items = searchRes.data.items;
    const videoIds = items.map(i => i.id.videoId).join(',');

    // Get video details (duration, views)
    const detailsRes = await fetchWithRotation('/videos', {
      part: 'contentDetails,statistics',
      id: videoIds
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
    if (err.message === 'ALL_KEYS_EXHAUSTED') {
      return res.status(503).json({ error: 'All YouTube API keys have exhausted their daily quota.' });
    }
    console.error('YouTube search error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error?.message || 'Search failed' });
  }
});

// GET /api/video/:id - Video details
router.get('/video/:id', async (req, res) => {
  const { id } = req.params;
  if (apiKeys.length === 0) {
    return res.status(503).json({ error: 'YouTube API keys not configured' });
  }

  try {
    const detailsRes = await fetchWithRotation('/videos', {
      part: 'snippet,contentDetails,statistics',
      id
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
    if (err.message === 'ALL_KEYS_EXHAUSTED') {
      return res.status(503).json({ error: 'All YouTube API keys have exhausted their daily quota.' });
    }
    console.error('YouTube video error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch video details' });
  }
});

// GET /api/recommendations?videoId=id&q=title
router.get('/recommendations', async (req, res) => {
  const { videoId, q } = req.query;
  if (apiKeys.length === 0) {
    return res.status(503).json({ error: 'YouTube API keys not configured' });
  }

  try {
    let items = [];

    if (q) {
      // YouTube deprecated 'relatedToVideoId' search in API v3.
      // Fallback: search using title keywords + music to simulate recommendations
      const searchRes = await fetchWithRotation('/search', {
        part: 'snippet',
        q: q + ' song related',
        type: 'video',
        maxResults: 12,
        videoCategoryId: '10'
      });
      items = searchRes.data.items;
    } else {
      // Default recommendations
      const searchRes = await fetchWithRotation('/search', {
        part: 'snippet',
        q: 'popular hit music 2024',
        type: 'video',
        maxResults: 12,
        videoCategoryId: '10'
      });
      items = searchRes.data.items;
    }

    // Get durations
    const videoIds = items.map(i => i.id?.videoId || i.id).filter(Boolean).join(',');
    let detailsMap = {};

    if (videoIds) {
      const detailsRes = await fetchWithRotation('/videos', {
        part: 'contentDetails',
        id: videoIds
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
    if (err.message === 'ALL_KEYS_EXHAUSTED') {
      return res.status(503).json({ error: 'All YouTube API keys have exhausted their daily quota.' });
    }
    console.error('Recommendations error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

module.exports = router;
