export default async function globalTeardown() {
  if (global.__SERVER_PROC__) {
    try {
      process.kill(global.__SERVER_PROC__, 'SIGTERM');
    } catch (e) {
      // ignore
    }
  }
}
