import { and, eq } from 'drizzle-orm'

import { type DbOrTx, layouts, placements, projectMembers, roomOpenings, rooms } from '@/db'
import { forbidden, notFound, requireEntity } from '@/lib/errors'

export type Role = 'owner' | 'editor'

export function requireProjectRole(db: DbOrTx, projectId: string, userId: string, role: Role) {
    const member = db
        .select()
        .from(projectMembers)
        .where(
            and(
                eq(projectMembers.projectId, projectId),
                eq(projectMembers.userId, userId),
                eq(projectMembers.status, 'active'),
            ),
        )
        .get()
    if (!member) throw notFound('Project')
    if (role === 'owner' && member.role !== 'owner') throw forbidden('Only the owner can do this')
    return member
}

/** Library rooms belong to their owner; project rooms to the project's members. */
export function requireRoom(db: DbOrTx, roomId: string, userId: string) {
    const room = requireEntity(db.select().from(rooms).where(eq(rooms.id, roomId)).get(), 'Room')
    if (room.projectId) requireProjectRole(db, room.projectId, userId, 'editor')
    else if (room.ownerId !== userId) throw notFound('Room')
    return room
}

export function requireOpening(db: DbOrTx, openingId: string, userId: string) {
    const opening = requireEntity(
        db.select().from(roomOpenings).where(eq(roomOpenings.id, openingId)).get(),
        'Opening',
    )
    return { opening, room: requireRoom(db, opening.roomId, userId) }
}

export function requireLayout(db: DbOrTx, layoutId: string, userId: string) {
    const layout = requireEntity(
        db.select().from(layouts).where(eq(layouts.id, layoutId)).get(),
        'Layout',
    )
    requireProjectRole(db, layout.projectId, userId, 'editor')
    return layout
}

export function requirePlacement(db: DbOrTx, placementId: string, userId: string) {
    const row = requireEntity(
        db
            .select({ placement: placements, projectId: layouts.projectId })
            .from(placements)
            .innerJoin(layouts, eq(layouts.id, placements.layoutId))
            .where(eq(placements.id, placementId))
            .get(),
        'Placement',
    )
    requireProjectRole(db, row.projectId, userId, 'editor')
    return row
}
