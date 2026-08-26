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
    // Initialize DB connection check
    await getDb();

    const app = createApp();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[TrueSpec Backend] Server listening on http://0.0.0.0:${PORT}`);
    });
  } catch (err: any) {
    console.error('[TrueSpec Backend] Failed to start server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}
