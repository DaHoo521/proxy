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

// Proxy requests to the hardcoded WordPress REST API endpoint
app.use(
  '/api/proxy',
  createProxyMiddleware({
    target: 'https://artportfolio.infy.uk',
    changeOrigin: true,
    pathRewrite: { '^/api/proxy': '/wp-json/wp/v2/posts?_embed' }, // Append the correct REST API path
    agent, // Use the custom agent that ignores SSL errors
    logLevel: 'debug', // Enable detailed logging for debugging
    selfHandleResponse: true, // Enable manual response handling
    onProxyRes: (proxyRes, req, res) => {
      let body = '';

      proxyRes.on('data', (chunk) => {
        body += chunk;
      });

      proxyRes.on('end', () => {
        console.log('Response from target:', proxyRes.statusCode, body);

        // Set CORS headers and return the response
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.status(proxyRes.statusCode).send(body);
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

// Start the server
app.listen(PORT, () => {
  console.log(`CORS Proxy running on port ${PORT}`);
});
