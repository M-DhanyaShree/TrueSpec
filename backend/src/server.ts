import dotenv from 'dotenv';
import path from 'path';
import createApp from './app';
import { getDb } from './db';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = parseInt(process.env.PORT || '5000', 10);

async function startServer() {
  try {
    // Initialize DB connection and auto-seed check
    await getDb();

    const app = createApp();
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`[TrueSpec Backend] Server listening on http://0.0.0.0:${PORT}`);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n======================================================`);
        console.error(`[TrueSpec Backend Error] Port ${PORT} is already in use!`);
        console.error(`Another process is already running on port ${PORT}.`);
        console.error(`To free port ${PORT} on Windows:`);
        console.error(`  1. Run: netstat -ano | findstr :${PORT}`);
        console.error(`  2. Run: taskkill /PID <PID> /F`);
        console.error(`Or set PORT=5001 in your .env file.`);
        console.error(`======================================================\n`);
        process.exit(1);
      } else {
        console.error('[TrueSpec Backend] Server error:', err);
        process.exit(1);
      }
    });
  } catch (err: any) {
    console.error('[TrueSpec Backend] Failed to start server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}
