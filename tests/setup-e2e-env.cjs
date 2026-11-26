require('dotenv').config();

const isCI = process.env.CI === 'true';

const databaseUrl = isCI
    ? process.env.DATABASE_URL
    : process.env.TEST_DATABASE_URL;

if (!databaseUrl) {
    throw new Error('Test database URL is not configured.');
}

const url = new URL(databaseUrl);

const isLocal = ['localhost', '127.0.0.1', '[::1]']
    .includes(url.hostname);

const expectedDatabase = isCI ? 'ci_test' : 'postgres';

if (!isLocal || url.pathname.slice(1) !== expectedDatabase) {
    throw new Error('Refusing to run tests on a non-test database.');
}

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = databaseUrl;

console.log(
    `[TEST DATABASE] ${url.hostname}${url.pathname}`
);