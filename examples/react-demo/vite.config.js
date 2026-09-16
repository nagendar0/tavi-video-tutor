import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { YoutubeTranscript } from 'youtube-transcript';
import url from 'url';
import path from 'path';

const youtubeTranscriptPlugin = () => ({
  name: 'youtube-transcript-api',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const parsedUrl = url.parse(req.url, true);
      
      // 1. YouTube Transcript Fetcher Proxy
      if (parsedUrl.pathname === '/api/youtube-transcript') {
        const videoId = parsedUrl.query.v;
        const lang = parsedUrl.query.lang || 'en';
        
        if (!videoId) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing video id "v" parameter' }));
          return;
        }

        try {
          const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang });
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify(transcript));
        } catch (err) {
          console.error('Error fetching YouTube transcript:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({ error: err.message || 'Failed to fetch transcript' }));
        }
        return;
      }

      // 2. Google Translate Proxy (Free undocumented API helper with CORS)
      if (parsedUrl.pathname === '/api/translate') {
        const text = parsedUrl.query.text;
        const to = parsedUrl.query.to || 'en';
        const from = parsedUrl.query.from || 'auto';
        
        if (!text) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing "text" parameter' }));
          return;
        }

        try {
          const fetchUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
          const response = await fetch(fetchUrl);
          if (!response.ok) {
            throw new Error(`Google Translate responded with status ${response.status}`);
          }
          const data = await response.json();
          const translatedText = data[0].map(item => item[0]).join('');
          
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({ translation: translatedText }));
        } catch (err) {
          console.error('Translation error:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({ error: err.message || 'Failed to translate' }));
        }
        return;
      }

      next();
    });
  }
});

export default defineConfig({
  plugins: [react(), youtubeTranscriptPlugin()],
  server: {
    port: 5180
  }
});
