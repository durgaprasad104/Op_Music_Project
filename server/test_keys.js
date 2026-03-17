const axios = require('axios');
const keys = [
  'AIzaSyBv26fwHlwdujrDzM6Ub3_0MCEt4csfQkw',
  'AIzaSyCA5rbckunyReTWS8H9210E_Vvt3Ejv2jg',
  'AIzaSyCsRqBY-F2f3MOg-z2E1JmAh3RKaVUIfCA'
];

async function testKeys() {
  for (let i = 0; i < keys.length; i++) {
    try {
      const res = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: { part: 'snippet', q: 'test', key: keys[i], maxResults: 1 }
      });
      console.log(`✅ Key ${i} WORKS! Total Results: ${res.data.pageInfo.totalResults}`);
    } catch (err) {
      console.log(`❌ Key ${i} FAILED: ${err.response?.data?.error?.message}`);
    }
  }
}
testKeys();
