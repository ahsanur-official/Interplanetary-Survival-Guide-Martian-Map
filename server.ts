import 'dotenv/config';
import http from 'http';
import path from 'path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createApiApp } from './src/apiApp';

async function startServer() {
  const port = Number(process.env.PORT) || 3000;
  const apiApp = createApiApp();
  const app = express();

  app.use(apiApp);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  const server = http.createServer(app);
  server.on('error', (error: any) => {
    if (error?.code === 'EADDRINUSE') {
      console.error(`Port ${port} is busy. Stop the existing MarsWay server or choose another PORT.`);
      process.exit(1);
    }
    console.error('MarsWay server error:', error);
  });
  server.listen(port, '0.0.0.0', () => {
    console.log(`MarsWay offline server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start MarsWay offline server:', error);
  process.exit(1);
});
