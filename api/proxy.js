import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = process.env.PORT || 3000; // Use the port provided by Render or default to 3000

// Enable CORS for all origins
app.use(cors());

// Route to handle the root URL and display a welcome message
app.get('/', (req, res) => {
  res.send('CORS Proxy is running. Use /api/proxy?url=https://artportfolio.infy.uk/wp-json/wp/v2/posts?_embed to proxy requests.');
});

// Proxy requests
app.use(
  '/api/proxy',
  createProxyMiddleware({
    changeOrigin: true,
    target: '', // Target URL will be dynamically set based on the query parameter
    router: (req) => req.query.url, // Dynamically route to the target URL from the query parameter
    pathRewrite: { '^/api/proxy': '' }, // Remove "/api/proxy" from the forwarded path
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
