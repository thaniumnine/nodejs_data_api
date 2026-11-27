import 'dotenv/config';
import { hashPassword } from '../src/auth/password';
import { withClient } from './util';

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

const organisationName = process.env.ADMIN_ORGANISATION?.trim();

const organisationMode = process.argv.includes('--organisation');


//if (!password || password.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters');

async function main() {
  if (!email) throw new Error('ADMIN_EMAIL is required');
  if (!password) throw new Error('PASSWORD is required');

  if (organisationMode && !organisationName) {
    throw new Error('ADMIN_ORGANISATION is required');
  }

  if (!organisationMode && organisationName) {
    throw new Error('Use --organisation when ADMIN_ORGANISATION is set');
  }

  await withClient(async (client) => {

    const passwordHash = await hashPassword(password);

    // Organisation-specific admin creation
    if (organisationMode) {
      const result = await client.query(
        `SELECT id, name
         FROM public.organisations
         WHERE name = $1`,
        [organisationName]
      );

      if (result.rows.length !== 1) {
        throw new Error(
          `Organisation not uniquely found: ${organisationName}`
        );
      }

      const organisation = result.rows[0];

      const created = await client.query(
        `INSERT INTO public.users (
          email,
          password_hash,
          display_name,
          roles,
          is_active,
          org_ref_ids
        )
        VALUES ($1, $2, $3, $4::jsonb, true, ARRAY[$5::BIGINT])
        ON CONFLICT (email) DO NOTHING
        RETURNING id`,
        [
          email.toLowerCase(),
          passwordHash,
          `${organisation.name} Admin`,
          JSON.stringify(['admin']),
          organisation.id
        ]
      );

      if (created.rowCount !== 1) {
        throw new Error('A user with this email already exists');
      }

      console.log(
        `Admin user created: ${email.toLowerCase()}`
      );

      console.log(
        `Organisation: ${organisation.name} (${organisation.id})`
      );

      return;
    }

    // exisiting master admin seeding functionality
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
