import { dbOperations } from '../src/lib/db';

const result = dbOperations.syncAllBorrowingStatuses();

console.log(`Validated borrowing status for ${result.total} records.`);
console.log(`Updated ${result.updated} record(s).`);

process.exit(0);
