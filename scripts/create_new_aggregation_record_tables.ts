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

    const tableName = orgPrefix + "_" + "device_type_aggregation";
    assertSafeIdentifier(tableName)

    await withClient(async (client) => {
        const allDeviceTypeMetadata = await fetchDeviceTypeMetadata(client, tableName)

        for (const{ device_type, columns } of allDeviceTypeMetadata) {
            const columnQuery = buildSqlColumns(columns);


            await createAggregationRecordDatabase(client, orgPrefix,device_type, columnQuery);
        }
    })
}


async function fetchDeviceTypeMetadata(client: Client, tableName: string) {
    const result = await client.query(`
         SELECT device_type, columns from ${tableName}`) as any //to do find correct type

        ;
    if (result.rowCount === 0) {
        throw new Error(`No metadata found for any devices"`);
    }
    return result.rows
}

function buildSqlColumns(columns: any[]) {
    let columnQuery = "";
    for (const [index, column] of columns.entries()) {
        if (index > 0) {
            columnQuery += ",\n";
        }
        columnQuery += `${column.name} ${column.type}`;
    }
    return columnQuery;
}

async function createAggregationRecordDatabase(client: Client, orgPrefix: string, deviceType: string, columnQuery: string) {
    const newTableName = orgPrefix + "_" + "aggregations" + "_" + deviceType;
    assertSafeIdentifier(newTableName)
    await client.query(`
        CREATE TABLE ${newTableName} (
            id BIGSERIAL PRIMARY KEY,

            device_id TEXT NOT NULL,
            event_timestamp TIMESTAMPTZ NOT NULL,
            agg_type TEXT NOT NULL,

            ${columnQuery},

            UNIQUE (device_id,agg_type, event_timestamp),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            device_ref_id BIGSERIAL NOT NULL,
            CONSTRAINT fk_device_identity
                FOREIGN KEY(device_id)
                    REFERENCES sim_device_identifier(id)
        );

        CREATE INDEX idx_${newTableName}_device_id
        ON ${newTableName} (device_id);

        CREATE INDEX idx_${newTableName}_timestamp
        ON ${newTableName} (event_timestamp);

        CREATE INDEX idx_${newTableName}_agg_type
        ON ${newTableName} (agg_type);

        CREATE INDEX idx_${newTableName}_device_time
        ON ${newTableName} (device_id, event_timestamp DESC);

        CREATE INDEX idx_${newTableName}_device_time_type
        ON ${newTableName} (device_id, agg_type, event_timestamp DESC);
    `,
    );

}


void main();

