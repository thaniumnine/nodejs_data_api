import 'dotenv/config';

import { withClient } from './util';
import { assertSafeIdentifier } from 'src/common/sql/identifiers';
import { Client } from 'pg';



async function main() {
    const orgPrefix = process.argv[2]

    if (!orgPrefix) {
        console.error("Usage: node create_new_aggregation_tables.ts <orgPrefix>");
        process.exit(1);
    }

    await withClient(async (client) => {
        await createAggregationDeviceTypeDatabase(client,orgPrefix);
  
    })
}



async function createAggregationDeviceTypeDatabase(client: Client, orgPrefix: string) {
    const newTableName = orgPrefix + "_" + "device_type_aggregation";
    assertSafeIdentifier(newTableName)
    await client.query(`
    create table  ${newTableName}(
            id uuid primary key default gen_random_uuid(),
            device_type text not null unique,
            columns jsonb not null default '[]'::jsonb,
            created_at timestamptz not null default now()
        );`,
    );

}




void main();

