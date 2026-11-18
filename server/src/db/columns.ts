import { integer } from 'drizzle-orm/sqlite-core'

/** Creation time as Unix milliseconds (UTC). */
export const createdAt = () =>
    integer('created_at')
        .notNull()
        .$defaultFn(() => Date.now())

/** Last update time; drizzle refreshes it on every `update()`. */
export const updatedAt = () =>
    integer('updated_at')
        .notNull()
        .$defaultFn(() => Date.now())
        .$onUpdateFn(() => Date.now())
