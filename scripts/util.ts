import { Client } from "pg";

const databaseUrl = process.env.DATABASE_URL;

export async function withClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
    if (!databaseUrl) {
        throw new Error("DATABASE_URL env is not set");
    }
    const client = new Client({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    try {
        return await fn(client)
    } finally {
        await client.end();
    }
}