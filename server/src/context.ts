import type { Db } from './db'
import type { User } from './services/users'

export type AppEnv = {
    Variables: {
        db: Db
        user: User
        tokenHash: string
    }
}
