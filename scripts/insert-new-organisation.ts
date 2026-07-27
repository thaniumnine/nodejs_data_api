import 'dotenv/config';

import { withClient } from './util';



async function main() {
    const orgName = process.argv[2]
    const orgPrefix = process.argv[3]
    if (!orgName || !orgPrefix) {
        console.error("Usage: node insert-new-organisation.js <orgName> <orgPrefix>");
        process.exit(1);
    }
    await withClient(async (client) => {
        await client.query(`
            INSERT INTO organisations (
            name,
            prefix
            )
            VALUES (
                $1,
                $2
            );`,
            [orgName, orgPrefix]
        );
    })
}

void main();
