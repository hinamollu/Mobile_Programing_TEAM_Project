import { sql } from 'drizzle-orm'
import { check, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { createdAt, updatedAt } from '../columns'
import { projects } from './projects'
import { users } from './users'

export const rooms = sqliteTable(
    'rooms',
    {
        id: text('id').primaryKey(),
        ownerId: text('owner_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        /** `NULL` for library rooms; set for a project's private copy. */
        projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),
        name: text('name').notNull(),
        width: integer('width').notNull(),
        length: integer('length').notNull(),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [
        index('rooms_owner_id_idx').on(t.ownerId),
        index('rooms_project_id_idx').on(t.projectId),
    ],
)

export const roomOpenings = sqliteTable(
    'room_openings',
    {
        id: text('id').primaryKey(),
        roomId: text('room_id')
            .notNull()
            .references(() => rooms.id, { onDelete: 'cascade' }),
        kind: text('kind', { enum: ['door', 'window', 'outlet'] }).notNull(),
        wall: text('wall', { enum: ['n', 'e', 's', 'w'] }).notNull(),
        offset: integer('offset').notNull(),
        width: integer('width').notNull(),
        height: integer('height'),
        sillHeight: integer('sill_height'),
        hinge: text('hinge', { enum: ['left', 'right'] }),
        swing: text('swing', { enum: ['in', 'out'] }),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [
        index('room_openings_room_id_idx').on(t.roomId),
        check('room_openings_kind_check', sql`${t.kind} IN ('door', 'window', 'outlet')`),
        check('room_openings_wall_check', sql`${t.wall} IN ('n', 'e', 's', 'w')`),
        check('room_openings_hinge_check', sql`${t.hinge} IN ('left', 'right')`),
        check('room_openings_swing_check', sql`${t.swing} IN ('in', 'out')`),
    ],
)
