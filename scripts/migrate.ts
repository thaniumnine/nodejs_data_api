//don't want to accidentally run it
// only safe if calculate all checksums without executing them and add them to migrations database

import 'dotenv/config';
import { createHash } from 'crypto';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { withClient } from './util';


async function main() {
  await withClient(async (client) => {
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
        await client.query(sql); //don't want to execute them now as it will reset the database
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
  });
}

void main();
