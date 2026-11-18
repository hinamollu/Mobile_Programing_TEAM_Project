import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import type { AppEnv } from '@/context'
import { placements } from '@/db'
import { conflict } from '@/lib/errors'
import { newId } from '@/lib/id'
import { coord, idParam, mm, name, partial, rotation, uuid, validate } from '@/lib/validate'
import { requireLayout, requirePlacement } from '@/services/access'
import { bumpRevision } from '@/services/revision'

import { requireFurniture } from './furniture'

const position = z.object({ x: coord, y: coord, rotation: rotation.default(0) })

const placementBody = z.union([
    position.extend({ id: uuid.optional(), furnitureId: uuid }),
    position.extend({
        id: uuid.optional(),
        name,
        type: z.string().trim().min(1).max(50),
        width: mm,
        length: mm,
        height: mm,
    }),
])
const placementPatch = partial(z.object({ x: coord, y: coord, rotation }))

export const placementRoutes = new Hono<AppEnv>()
    .post(
        '/layouts/:id/placements',
        validate('param', idParam),
        validate('json', placementBody),
        (c) => {
            const db = c.var.db
            const userId = c.var.user.id
            const layout = requireLayout(db, c.req.valid('param').id, userId)
            const body = c.req.valid('json')

            if (body.id) {
                const existing = db
                    .select()
                    .from(placements)
                    .where(eq(placements.id, body.id))
                    .get()
                if (existing?.layoutId === layout.id) return c.json(existing)
                if (existing) throw conflict('Placement id already in use')
            }

            const item =
                'furnitureId' in body ? requireFurniture(db, body.furnitureId, userId) : body

            return db.transaction((tx) => {
                const placement = tx
                    .insert(placements)
                    .values({
                        id: body.id ?? newId(),
                        layoutId: layout.id,
                        furnitureId: 'furnitureId' in body ? body.furnitureId : null,
                        name: item.name,
                        type: item.type,
                        width: item.width,
                        length: item.length,
                        height: item.height,
                        x: body.x,
                        y: body.y,
                        rotation: body.rotation,
                    })
                    .returning()
                    .get()
                return c.json({ ...placement, revision: bumpRevision(tx, layout.projectId) }, 201)
            })
        },
    )
    .patch('/placements/:id', validate('param', idParam), validate('json', placementPatch), (c) => {
        const db = c.var.db
        const { placement, projectId } = requirePlacement(
            db,
            c.req.valid('param').id,
            c.var.user.id,
        )
        return db.transaction((tx) => {
            const updated = tx
                .update(placements)
                .set(c.req.valid('json'))
                .where(eq(placements.id, placement.id))
                .returning()
                .get()
            return c.json({ ...updated, revision: bumpRevision(tx, projectId) })
        })
    })
    .delete('/placements/:id', validate('param', idParam), (c) => {
        const db = c.var.db
        const { placement, projectId } = requirePlacement(
            db,
            c.req.valid('param').id,
            c.var.user.id,
        )
        db.transaction((tx) => {
            tx.delete(placements).where(eq(placements.id, placement.id)).run()
            bumpRevision(tx, projectId)
        })
        return c.body(null, 204)
    })
