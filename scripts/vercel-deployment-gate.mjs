// Vercel Ignored Build Step: exit 0 = skip deployment; exit 1 = build.
// Release commits must explicitly include [deploy] in their commit message.
import { execFileSync } from 'node:child_process';

let message = process.env.VERCEL_GIT_COMMIT_MESSAGE;
if (!message) {
  try {
    message = execFileSync('git', ['log', '-1', '--format=%B'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    console.error('Unable to read the Git commit message; skipping the deployment safely.', error.message);
    process.exit(0);
  }
}

if (/(?:^|\s)\[deploy\](?=\s|$)/i.test(message)) {
  console.log('Explicit [deploy] release requested; allowing Vercel build.');
  process.exit(1);
}

console.log('Development/test/docs commit without [deploy]; skipping Vercel build.');
process.exit(0);
