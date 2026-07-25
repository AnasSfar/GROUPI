import * as dotenv from 'dotenv';
import * as path from 'path';

// Load the isolated test database configuration BEFORE Nest's ConfigModule boots.
// dotenv does not overwrite variables already present in process.env, so this also
// protects us if a real `.env` ever gets added to apps/api in the future.
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// Safety net: never let e2e tests run against the dev database by accident.
if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.includes('groupi_test')) {
  throw new Error(
    'Refusing to run e2e tests: DATABASE_URL does not point at the groupi_test database. ' +
      'Check apps/api/.env.test.',
  );
}
