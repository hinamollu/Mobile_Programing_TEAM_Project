import { sql } from 'drizzle-orm'
import {
    type AnySQLiteColumn,
    check,
    index,
    integer,
    primaryKey,
    sqliteTable,
    text,
} from 'drizzle-orm/sqlite-core'

import { createdAt, updatedAt } from './columns'

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
        expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
        createdAt: createdAt(),
    },
    (t) => [index('sessions_user_id_idx').on(t.userId)],
)

export const rooms = sqliteTable(
    'rooms',
    {
        id: text('id').primaryKey(),
        ownerId: text('owner_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        /** `NULL` for library rooms; set for a project's private copy. */
        projectId: text('project_id').references((): AnySQLiteColumn => projects.id, {
            onDelete: 'cascade',
        }),
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
