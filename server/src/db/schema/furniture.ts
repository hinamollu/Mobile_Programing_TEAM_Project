import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { createdAt, updatedAt } from '../columns'
import { users } from './users'

export const furniture = sqliteTable(
    'furniture',
    {
        id: text('id').primaryKey(),
        ownerId: text('owner_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        name: text('name').notNull(),
        type: text('type').notNull(),
        width: integer('width').notNull(),
        length: integer('length').notNull(),
        height: integer('height').notNull(),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [index('furniture_owner_id_idx').on(t.ownerId)],
)
