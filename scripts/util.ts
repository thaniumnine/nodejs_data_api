import { Client } from "pg";

const databaseUrl = process.env.DATABASE_URL;

export async function withClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
    if (!databaseUrl) {
        throw new Error("DATABASE_URL env is not set");
    }

    const hostname = new URL(databaseUrl).hostname;
    const isLocal = hostname === "127.0.0.1" || hostname === "localhost";
    const client = new Client({
        connectionString: databaseUrl,
        ssl: isLocal ? false : { rejectUnauthorized: false },
    });

    await client.connect();

    try {
        return await fn(client)
    } finally {
        await client.end();
    }
}