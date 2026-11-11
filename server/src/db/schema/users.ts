import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { createdAt, updatedAt } from '../columns'

export const users = sqliteTable('users', {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    displayName: text('display_name').notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
})

export const sessions = sqliteTable(
    'sessions',
    {
        tokenHash: text('token_hash').primaryKey(),
        userId: text('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        expiresAt: integer('expires_at').notNull(),
        createdAt: createdAt(),
    },
    (t) => [index('sessions_user_id_idx').on(t.userId)],
)
