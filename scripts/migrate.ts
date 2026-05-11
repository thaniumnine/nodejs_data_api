import 'dotenv/config';
import { createHash } from 'crypto';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { Client } from 'pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

async function main() {
  const client = new Client({ connectionString: databaseUrl,  ssl: {
    rejectUnauthorized: false,
  } });
  await client.connect();

  try {
    await client.query(`
      create table if not exists _migrations (
        filename text primary key,
        checksum text not null,
        applied_at timestamptz not null default now()
      )
    `);

    const migrationsDir = join(process.cwd(), 'migrations');
    const files = (await readdir(migrationsDir))
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const sql = await readFile(join(migrationsDir, file), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');

      const existing = await client.query<{ checksum: string }>(
        'select checksum from _migrations where filename = $1',
        [file]
      );

      if (existing.rowCount && existing.rows[0].checksum !== checksum) {
        throw new Error(`Migration checksum mismatch for ${file}`);
      }

      if (existing.rowCount) {
        console.log(`Skipping ${file}`);
        continue;
      }

      console.log(`Applying ${file}`);
      await client.query('begin');
      try {
        await client.query(sql);
        await client.query('insert into _migrations(filename, checksum) values ($1, $2)', [
          file,
          checksum
        ]);
        await client.query('commit');
      } catch (error) {
        await client.query('rollback');
        throw error;
      }
    }
  } finally {
    await client.end();
  }
}

void main();
