import { createProxyMiddleware } from 'http-proxy-middleware';

export default function handler(req, res) {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    res.status(400).json({ error: 'Missing url query parameter' });
    return;
  }

  // Set CORS headers for both preflight and actual requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(204).end(); // Respond with no content for preflight
    return;
  }

  // Create and run the proxy middleware
  const proxy = createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    selfHandleResponse: true,
    onProxyRes(proxyRes, req, res) {
      let body = '';

      proxyRes.on('data', (chunk) => {
        body += chunk;
      });

      proxyRes.on('end', () => {
        // Forward CORS headers in the final response
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        res.setHeader('Content-Type', 'application/json');
        res.status(proxyRes.statusCode).send(body);
      });
    },
    onError(err, req, res) {
      res.status(500).json({ error: 'Proxy error', details: err.message });
    },
  });

  proxy(req, res);
}
