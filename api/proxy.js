import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = process.env.PORT || 3000; // Use the port provided by Render or default to 3000

// Enable CORS for all origins
app.use(cors());

// Proxy requests
app.use(
  '/api/proxy',
  createProxyMiddleware({
    target: (req) => req.query.url,
    changeOrigin: true,
    pathRewrite: { '^/api/proxy': '' },
    onError: (err, req, res) => {
      res.status(500).json({ error: 'Proxy error', details: err.message });
    },
  })
);

// Start the server
app.listen(PORT, () => {
  console.log(`CORS Proxy running on port ${PORT}`);
});

