import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = process.env.PORT || 3000; // Use the port provided by Render or default to 3000

// Enable CORS for all origins
app.use(cors());

// Middleware to log incoming requests (optional but useful for debugging)
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Proxy requests
app.use(
  '/api/proxy',
  createProxyMiddleware({
    changeOrigin: true, // Changes the origin of the host header to the target URL
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
