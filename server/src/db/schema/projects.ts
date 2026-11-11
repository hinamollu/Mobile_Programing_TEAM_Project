import { sql } from 'drizzle-orm'
import { check, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { createdAt, updatedAt } from '../columns'
import { furniture } from './furniture'
import { users } from './users'

export const projects = sqliteTable(
    'projects',
    {
        id: text('id').primaryKey(),
        ownerId: text('owner_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        name: text('name').notNull(),
        revision: integer('revision').notNull().default(0),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [index('projects_owner_id_idx').on(t.ownerId)],
)

export const layouts = sqliteTable(
    'layouts',
    {
        id: text('id').primaryKey(),
        projectId: text('project_id')
            .notNull()
            .references(() => projects.id, { onDelete: 'cascade' }),
        name: text('name').notNull(),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [index('layouts_project_id_idx').on(t.projectId)],
)

export const placements = sqliteTable(
    'placements',
    {
        id: text('id').primaryKey(),
        layoutId: text('layout_id')
            .notNull()
            .references(() => layouts.id, { onDelete: 'cascade' }),
        furnitureId: text('furniture_id').references(() => furniture.id, {
            onDelete: 'set null',
        }),
        name: text('name').notNull(),
        type: text('type').notNull(),
        width: integer('width').notNull(),
        length: integer('length').notNull(),
        height: integer('height').notNull(),
        x: integer('x').notNull(),
        y: integer('y').notNull(),
        rotation: integer('rotation').notNull().$type<0 | 90 | 180 | 270>().default(0),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [
        index('placements_layout_id_idx').on(t.layoutId),
        index('placements_furniture_id_idx').on(t.furnitureId),
        check('placements_rotation_check', sql`${t.rotation} IN (0, 90, 180, 270)`),
    ],
)
