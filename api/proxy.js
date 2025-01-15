import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import https from 'https';
import zlib from 'zlib';

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

// Proxy requests to the hardcoded WordPress REST API endpoint
app.use(
  '/api/proxy',
  createProxyMiddleware({
    target: 'https://artportfolio.infy.uk',
    changeOrigin: true,
    pathRewrite: { '^/api/proxy': '/wp-json/wp/v2/posts?_embed' }, // Append the correct REST API path
    agent, // Use the custom agent that ignores SSL errors
    selfHandleResponse: true, // Enable manual response handling
    onProxyRes: (proxyRes, req, res) => {
      let body = [];

      // Collect response chunks
      proxyRes.on('data', (chunk) => {
        body.push(chunk);
      });

      proxyRes.on('end', () => {
        // Buffer the collected chunks
        body = Buffer.concat(body);

        // Check for compression and decompress if necessary
        const encoding = proxyRes.headers['content-encoding'];
        if (encoding === 'gzip') {
          zlib.gunzip(body, (err, decoded) => {
            if (err) {
              console.error('Decompression error:', err);
              res.status(500).json({ error: 'Decompression error' });
              return;
            }
            sendResponse(res, proxyRes.statusCode, decoded.toString());
          });
        } else if (encoding === 'br') {
          zlib.brotliDecompress(body, (err, decoded) => {
            if (err) {
              console.error('Decompression error:', err);
              res.status(500).json({ error: 'Decompression error' });
              return;
            }
            sendResponse(res, proxyRes.statusCode, decoded.toString());
          });
        } else {
          // No compression, send the raw response
          sendResponse(res, proxyRes.statusCode, body.toString());
        }
      });
    },
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
      res.status(500).json({ error: 'Proxy error', details: err.message });
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

// Helper function to send the response
function sendResponse(res, statusCode, body) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  res.status(statusCode).send(body);
}

// Start the server
app.listen(PORT, () => {
  console.log(`CORS Proxy running on port ${PORT}`);
});
