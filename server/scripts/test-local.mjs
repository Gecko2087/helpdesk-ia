import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temporary = await mkdtemp(resolve(tmpdir(), 'helpdesk-test-'));
const databasePath = resolve(temporary, 'test.db');
new DatabaseSync(databasePath).close();
const schemaPath = resolve(root, 'prisma/.test/schema.prisma');
await mkdir(dirname(schemaPath), { recursive: true });
const source = await readFile(resolve(root, 'prisma/schema.prisma'), 'utf8');
await writeFile(schemaPath, source.replace('provider = "postgresql"', 'provider = "sqlite"')
  .replace('output        = "../node_modules/.prisma/client"', 'output        = "../../node_modules/.prisma/client"'));
const environment = { ...process.env, NODE_ENV: 'test', AI_PROVIDER: 'demo', GEMINI_API_KEY: '',
  CLIENT_URL: 'http://localhost:3001', DATABASE_URL: 'file:' + databasePath.replaceAll('\\', '/') };
function run(entry, args, env = environment) {
  const result = spawnSync(process.execPath, [resolve(root, entry), ...args], { cwd: root, env, stdio: 'inherit' });
  if (result.status !== 0) throw new Error('Local verification failed: ' + entry);
}
try {
  run('node_modules/prisma/build/index.js', ['generate', '--schema', schemaPath]);
  run('node_modules/prisma/build/index.js', ['db', 'push', '--skip-generate', '--schema', schemaPath]);
  run('node_modules/vitest/vitest.mjs', ['run', '--no-file-parallelism', '--maxWorkers', '1']);
} finally {
  // Restore the PostgreSQL client used by deployment; no remote database access.
  run('node_modules/prisma/build/index.js', ['generate', '--schema', 'prisma/schema.prisma'],
    { ...environment, DATABASE_URL: 'postgresql://build:build@localhost:5432/build' });
}
