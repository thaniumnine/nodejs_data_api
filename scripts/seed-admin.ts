import 'dotenv/config';
import { Client } from 'pg';
import { hashPassword } from '../src/auth/password';

const databaseUrl = process.env.DATABASE_URL;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!databaseUrl) throw new Error('DATABASE_URL is required');
if (!email) throw new Error('ADMIN_EMAIL is required');
if (!password || password.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters');

async function main() {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const passwordHash = await hashPassword(password);

    await client.query(
      `insert into users(email, password_hash, display_name, roles, is_active)
       values ($1, $2, $3, $4::jsonb, true)
       on conflict (email) do update
         set password_hash = excluded.password_hash,
             roles = excluded.roles,
             is_active = true,
             updated_at = now()`,
      [email.toLowerCase(), passwordHash, 'Admin', JSON.stringify(['admin'])]
    );

    console.log(`Admin user ready: ${email.toLowerCase()}`);
  } finally {
    await client.end();
  }
}

void main();
