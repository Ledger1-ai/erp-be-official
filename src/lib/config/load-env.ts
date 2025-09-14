import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

export function loadEnv(): void {
  try {
    const cwd = process.cwd();
    const envPath = path.join(cwd, '.env');
    const envLocalPath = path.join(cwd, '.env.local');
    const standinPath = path.join(cwd, 'envstandin');

    // Load .env first
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
    }
    // Then override with .env.local if present
    if (fs.existsSync(envLocalPath)) {
      dotenv.config({ path: envLocalPath, override: true });
    }

    // Fallback: if core DB vars still missing, try envstandin
    if (!process.env.MONGODB_URI && fs.existsSync(standinPath)) {
      dotenv.config({ path: standinPath, override: false });
    }
  } catch {
    // no-op: best effort
  }
}


