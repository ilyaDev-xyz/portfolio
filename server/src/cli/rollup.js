// CLI entry for the nightly systemd timer. Idempotent — safe to re-run.
import { openDb, closeDb } from '../db.js';
import { runRollup } from '../rollup.js';

const dbPath = process.env.DB_PATH || './data/events.db';

openDb(dbPath);
const result = runRollup();
console.log('rollup ok', result);
closeDb();
