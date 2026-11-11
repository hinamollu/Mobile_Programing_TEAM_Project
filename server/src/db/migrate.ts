import { existsSync } from 'node:fs'
import { join } from 'node:path'

import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import { migrate } from 'drizzle-orm/bun-sqlite/migrator'

export function defaultMigrationsDir() {
    return join(import.meta.dir, 'migrations')
}

export function runMigrations(
    db: BunSQLiteDatabase<Record<string, unknown>>,
    migrationsDir = defaultMigrationsDir(),
) {
    if (!existsSync(join(migrationsDir, 'meta', '_journal.json'))) {
        throw new Error(`Migrations not found in ${migrationsDir}`)
    }
    migrate(db, { migrationsFolder: migrationsDir })
}
