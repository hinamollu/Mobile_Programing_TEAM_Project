import { createApp } from './app'
import { openDatabase } from './db'
import { env } from './env'

const { db } = openDatabase({ path: env.databasePath })

export default {
    port: env.port,
    fetch: createApp(db).fetch,
}
