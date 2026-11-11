import { join } from 'node:path'

import { z } from 'zod'

const EnvSchema = z.object({
    PORT: z.coerce.number().int().positive().default(3000),
    DATA_DIR: z.string().trim().min(1).default('./data'),
    DATABASE_URL: z.string().trim().min(1).optional(),
    SESSION_TTL_DAYS: z.coerce.number().int().positive().default(30),
})

export function loadEnv(source: Record<string, string | undefined> = process.env) {
    const raw = EnvSchema.parse(source)
    return {
        port: raw.PORT,
        dataDir: raw.DATA_DIR,
        databasePath: raw.DATABASE_URL ?? join(raw.DATA_DIR, 'database.db'),
        sessionTtlDays: raw.SESSION_TTL_DAYS,
    }
}

export const env = loadEnv()
