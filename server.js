const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

// Proxy API requests
app.use('/api/llama', createProxyMiddleware({ 
  target: 'https://llamatool.us.gaianet.network',
  changeOrigin: true,
  pathRewrite: {'^/api/llama': '/v1'},
}));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});