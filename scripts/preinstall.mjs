import { unlinkSync } from 'fs';
import { join } from 'path';

const userAgent = process.env.npm_config_user_agent;
if (!userAgent?.includes('pnpm')) {
  console.error('Use pnpm instead');
  process.exit(1);
}

// Remove lock files
const lockFiles = ['package-lock.json', 'yarn.lock'];
const rootDir = new URL('.', import.meta.url).pathname.slice(0, -9); // Remove 'scripts/'

lockFiles.forEach((file) => {
  try {
    unlinkSync(join(rootDir, file));
  } catch (e) {
    // File doesn't exist, that's fine
  }
});
