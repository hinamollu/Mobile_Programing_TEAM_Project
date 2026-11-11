import { and, asc, eq, isNull } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import type { AppEnv } from '@/context'
import { type Db, roomOpenings, rooms } from '@/db'
import { conflict, notFound } from '@/lib/errors'
import { newId } from '@/lib/id'
import { coord, idParam, mm, name, uuid, validate } from '@/lib/validate'
import { requireOpening, requireRoom } from '@/services/access'
import { bumpRevision } from '@/services/revision'
import { getRoom, withOpenings } from '@/services/rooms'

const openingFields = z.object({
    kind: z.enum(['door', 'window', 'outlet']),
    wall: z.enum(['n', 'e', 's', 'w']),
    offset: coord,
    width: mm,
    height: mm.nullish(),
    sillHeight: coord.nullish(),
    hinge: z.enum(['left', 'right']).nullish(),
    swing: z.enum(['in', 'out']).nullish(),
})
const openingBody = openingFields.extend({ id: uuid.optional() })

const roomBody = z.object({
    id: uuid.optional(),
    name,
    width: mm,
    length: mm,
    openings: z.array(openingBody).max(100).optional(),
})
const roomPatch = roomBody.pick({ name: true, width: true, length: true }).partial()

function requireLibraryRoom(db: Db, roomId: string, userId: string) {
    const room = requireRoom(db, roomId, userId)
    if (room.projectId) throw notFound('Room')
    return room
}

export const roomRoutes = new Hono<AppEnv>()
    .get('/rooms', (c) => {
        const db = c.var.db
        const list = db
            .select()
            .from(rooms)
            .where(and(eq(rooms.ownerId, c.var.user.id), isNull(rooms.projectId)))
            .orderBy(asc(rooms.createdAt))
            .all()
        return c.json(withOpenings(db, list))
    })
    .post('/rooms', validate('json', roomBody), (c) => {
        const { openings = [], ...body } = c.req.valid('json')
        const db = c.var.db
        const userId = c.var.user.id

        if (body.id) {
            const existing = getRoom(db, body.id)
            if (existing?.ownerId === userId && !existing.projectId) return c.json(existing)
            if (existing) throw conflict('Room id already in use')
        }

        const id = db.transaction((tx) => {
            const room = tx
                .insert(rooms)
                .values({ ...body, id: body.id ?? newId(), ownerId: userId })
                .returning()
                .get()
            if (openings.length > 0) {
                tx.insert(roomOpenings)
                    .values(openings.map((o) => ({ ...o, id: o.id ?? newId(), roomId: room.id })))
                    .run()
            }
            return room.id
        })
        return c.json(getRoom(db, id), 201)
    })
    .get('/rooms/:id', validate('param', idParam), (c) => {
        const room = requireLibraryRoom(c.var.db, c.req.valid('param').id, c.var.user.id)
        return c.json(getRoom(c.var.db, room.id))
    })
    .patch('/rooms/:id', validate('param', idParam), validate('json', roomPatch), (c) => {
        const db = c.var.db
        const room = requireLibraryRoom(db, c.req.valid('param').id, c.var.user.id)
        db.update(rooms).set(c.req.valid('json')).where(eq(rooms.id, room.id)).run()
        return c.json(getRoom(db, room.id))
    })
    .delete('/rooms/:id', validate('param', idParam), (c) => {
        const db = c.var.db
        const room = requireLibraryRoom(db, c.req.valid('param').id, c.var.user.id)
        db.delete(rooms).where(eq(rooms.id, room.id)).run()
        return c.body(null, 204)
    })
    .post('/rooms/:id/openings', validate('param', idParam), validate('json', openingBody), (c) => {
        const db = c.var.db
        const room = requireRoom(db, c.req.valid('param').id, c.var.user.id)
        const body = c.req.valid('json')

        if (body.id) {
            const existing = db
                .select()
                .from(roomOpenings)
                .where(eq(roomOpenings.id, body.id))
                .get()
            if (existing?.roomId === room.id) return c.json(existing)
            if (existing) throw conflict('Opening id already in use')
        }

        return db.transaction((tx) => {
            const opening = tx
                .insert(roomOpenings)
                .values({ ...body, id: body.id ?? newId(), roomId: room.id })
                .returning()
                .get()
            const revision = room.projectId ? bumpRevision(tx, room.projectId) : undefined
            return c.json({ ...opening, revision }, 201)
        })
    })
    .patch(
        '/openings/:id',
        validate('param', idParam),
        validate('json', openingFields.partial()),
        (c) => {
            const db = c.var.db
            const { opening, room } = requireOpening(db, c.req.valid('param').id, c.var.user.id)
            return db.transaction((tx) => {
                const updated = tx
                    .update(roomOpenings)
                    .set(c.req.valid('json'))
                    .where(eq(roomOpenings.id, opening.id))
                    .returning()
                    .get()
                const revision = room.projectId ? bumpRevision(tx, room.projectId) : undefined
                return c.json({ ...updated, revision })
            })
        },
    )
    .delete('/openings/:id', validate('param', idParam), (c) => {
        const db = c.var.db
        const { opening, room } = requireOpening(db, c.req.valid('param').id, c.var.user.id)
        db.transaction((tx) => {
            tx.delete(roomOpenings).where(eq(roomOpenings.id, opening.id)).run()
            if (room.projectId) bumpRevision(tx, room.projectId)
        })
        return c.body(null, 204)
    })
