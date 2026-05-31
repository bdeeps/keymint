import { getPool, runMigrations } from './db.js'

const pool = getPool()
await runMigrations(pool)
await pool.end()
console.log('Migrations complete')
