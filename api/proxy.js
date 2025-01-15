import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import https from 'https';

const app = express();
const PORT = process.env.PORT || 3000; // Use the port provided by Render or default to 3000

// Disable SSL certificate verification for the proxy
const agent = new https.Agent({ rejectUnauthorized: false });

// Enable CORS for all origins
app.use(cors());

// Route to handle the root URL and display a welcome message
app.get('/', (req, res) => {
  res.send('CORS Proxy is running. It is hardcoded to proxy requests to artportfolio.infy.uk.');
});

// Proxy requests to the hardcoded URL
app.use(
  '/api/proxy',
  createProxyMiddleware({
    target: 'https://artportfolio.infy.uk/wp-json/wp/v2/posts?_embed',
    changeOrigin: true,
    agent, // Use the custom agent that ignores SSL errors
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
      res.status(500).json({ error: 'Proxy error', details: err.message });
    },
    onProxyRes: (proxyRes, req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    },
  })
);

// Handle preflight (OPTIONS) requests
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(204).end();
});

// Start the server
app.listen(PORT, () => {
  console.log(`CORS Proxy running on port ${PORT}`);
});
