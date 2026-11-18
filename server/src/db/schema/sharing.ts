import { sql } from 'drizzle-orm'
import { check, index, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { createdAt, updatedAt } from '../columns'
import { projects } from './projects'
import { users } from './users'

export const friendships = sqliteTable(
    'friendships',
    {
        requesterId: text('requester_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        addresseeId: text('addressee_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        status: text('status', { enum: ['pending', 'accepted'] }).notNull(),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [
        primaryKey({ columns: [t.requesterId, t.addresseeId] }),
        index('friendships_addressee_id_idx').on(t.addresseeId),
        check('friendships_status_check', sql`${t.status} IN ('pending', 'accepted')`),
        check('friendships_not_self_check', sql`${t.requesterId} <> ${t.addresseeId}`),
    ],
)

export const projectMembers = sqliteTable(
    'project_members',
    {
        projectId: text('project_id')
            .notNull()
            .references(() => projects.id, { onDelete: 'cascade' }),
        userId: text('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        role: text('role', { enum: ['owner', 'editor'] }).notNull(),
        status: text('status', { enum: ['invited', 'active'] }).notNull(),
        invitedBy: text('invited_by').references(() => users.id, { onDelete: 'set null' }),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [
        primaryKey({ columns: [t.projectId, t.userId] }),
        index('project_members_user_id_idx').on(t.userId),
        check('project_members_role_check', sql`${t.role} IN ('owner', 'editor')`),
        check('project_members_status_check', sql`${t.status} IN ('invited', 'active')`),
    ],
)
