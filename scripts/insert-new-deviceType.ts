import 'dotenv/config';

import { withClient } from './util';
import { assertSafeIdentifier } from 'src/common/sql/identifiers';

async function main() {
    const orgPrefix = process.argv[2]
    const deviceType = process.argv[3]
    const deviceColumns =JSON.parse(process.argv[4]);

    if (!deviceType || !orgPrefix || !deviceColumns) {
        console.error("Usage: node insert-new-deviceType.js <orgPrefix> <deviceType> <deviceColumns>");
        process.exit(1);
    }
   
    const tableName = orgPrefix + "_" + "device_type_aggregation"
    assertSafeIdentifier(tableName)
    
    await withClient(async (client) => {
        await client.query(`
            INSERT INTO ${tableName} (
            device_type,
            columns
            )
            VALUES (
                $1,
                $2
            );`,
            [deviceType, JSON.stringify(deviceColumns)]
        );
    })
}

void main();
