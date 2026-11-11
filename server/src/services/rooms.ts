import { asc, eq, inArray } from 'drizzle-orm'

import { type DbOrTx, roomOpenings, rooms } from '@/db'
import { newId } from '@/lib/id'

export type Room = typeof rooms.$inferSelect
export type Opening = typeof roomOpenings.$inferSelect

export function withOpenings(db: DbOrTx, list: Room[]) {
    if (list.length === 0) return []
    const openings = db
        .select()
        .from(roomOpenings)
        .where(
            inArray(
                roomOpenings.roomId,
                list.map((room) => room.id),
            ),
        )
        .orderBy(asc(roomOpenings.createdAt))
        .all()
    return list.map((room) => ({
        ...room,
        openings: openings.filter((opening) => opening.roomId === room.id),
    }))
}

export function getRoom(db: DbOrTx, roomId: string) {
    const room = db.select().from(rooms).where(eq(rooms.id, roomId)).get()
    return room ? withOpenings(db, [room])[0]! : null
}

export function copyRoom(
    tx: DbOrTx,
    roomId: string,
    values: { ownerId: string; projectId: string },
) {
    const { openings, ...room } = getRoom(tx, roomId)!
    const copy = tx
        .insert(rooms)
        .values({ ...room, ...values, id: newId(), createdAt: undefined, updatedAt: undefined })
        .returning()
        .get()
    if (openings.length > 0) {
        tx.insert(roomOpenings)
            .values(openings.map((opening) => ({ ...opening, id: newId(), roomId: copy.id })))
            .run()
    }
    return copy
}
