import 'dotenv/config';
import { readFileSync } from 'fs';
import { execFileSync } from 'child_process';

const orgPrefix = process.argv[2];
const deviceTypes = ['acu', 'inv', 'lt', 'mts', 'qse'];

for (const deviceType of deviceTypes) {
    const columns = JSON.parse(
        readFileSync(`${__dirname}/types/${deviceType}.json`, 'utf8')
    );

    execFileSync(process.execPath, [
        '--import',
        'tsx',
        `${__dirname}/insert-new-deviceType.ts`,
        orgPrefix,
        deviceType,
        JSON.stringify(columns),
    ], { stdio: 'inherit' });
}