import { spawnSync } from 'node:child_process';
import { cp, mkdir } from 'node:fs/promises';
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
for (const args of [
  ['ci', '--ignore-scripts', '--prefix', 'server'],
  ['ci', '--ignore-scripts', '--prefix', 'client'],
  ['run', 'build', '--prefix', 'client'],
  ['run', 'db:generate', '--prefix', 'server'],
]) {
  const result = spawnSync(npm, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) throw new Error('Build stage failed: ' + args.join(' '));
}
await mkdir('public', { recursive: true });
await cp('client/dist', 'public', { recursive: true });
