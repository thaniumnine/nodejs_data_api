import 'dotenv/config';
import { hashPassword } from '../src/auth/password';
import { withClient } from './util';

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;


//if (!password || password.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters');

async function main() {
  if (!email) throw new Error('ADMIN_EMAIL is required');
  if (!password) throw new Error('PASSWORD is required');

  await withClient(async (client) => {
    
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
  });

}

void main();
