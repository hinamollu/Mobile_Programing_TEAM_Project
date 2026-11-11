import { join } from 'node:path'

import { defineConfig } from 'drizzle-kit'

// Mirrors the server default: <DATA_DIR or ./data>/database.db
const dataDir = process.env.DATA_DIR ?? './data'

export default defineConfig({
    dialect: 'sqlite',
    schema: './src/db/schema/index.ts',
    out: './src/db/migrations',
    dbCredentials: {
        url: process.env.DATABASE_URL ?? join(dataDir, 'database.db'),
    },
})
