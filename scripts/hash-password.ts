import 'dotenv/config';
import { Client } from 'pg';
import { hashPassword, verifyPassword } from '../src/auth/password';

const databaseUrl = process.env.DATABASE_URL;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!databaseUrl) throw new Error('DATABASE_URL is required');
if (!email) throw new Error('ADMIN_EMAIL is required');
//if (!password || password.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters');

async function main() {

  if (password && password.length > 0) {

    const password = "Exp0ls1ve123435"

    const passwordHash = await hashPassword(password);

    console.log(`password hash: ${passwordHash}`);

    const databasehash = "scrypt$v1$ZyAt6i5QbycR1rU2AdyUrA$4onIXU5lIOokL8LiGxpu7GDwZgB7py-0AQTeeMGPDxXxm8oK5cqMo5Z53-i9WUhUjyIHfGvhuJqPloX60f66yg"

    const verifyPassworda = await verifyPassword(password, passwordHash)
    console.log(`ver: ${verifyPassworda}`);

    const password2 = "Exp0ls1ve123435"

    const passwordHash2 = await hashPassword(password);

    console.log(`password hash: ${passwordHash2}`);

    const verifyPasswordb = await verifyPassword(password, passwordHash2)

    console.log(`ver: ${verifyPasswordb}`);

  } else {
    console.log("password 0");
  }
}

void main();
