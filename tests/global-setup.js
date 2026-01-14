import { spawn } from 'child_process';
import http from 'http';

export default async function globalSetup() {
  process.env.SERVER_API_KEY = process.env.SERVER_API_KEY || 'dev-key';

  const serverProcess = spawn('node', ['server/index.js'], {
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  serverProcess.stdout.on('data', (d) => process.stdout.write(`[server] ${d}`));
  serverProcess.stderr.on('data', (d) => process.stderr.write(`[server] ${d}`));

  // Wait for server to respond on port 4000
  await new Promise((resolve, reject) => {
    const start = Date.now();
    (function wait() {
      const req = http.request({ method: 'GET', host: '127.0.0.1', port: 4000, path: '/api/jobs' }, (res) => {
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - start > 15000) return reject(new Error('Server failed to start'));
        setTimeout(wait, 200);
      });
      req.end();
    })();
  });

  global.__SERVER_PROC__ = serverProcess.pid;
}
