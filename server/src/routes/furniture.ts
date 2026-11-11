import { and, asc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import type { AppEnv } from '@/context'
import { type DbOrTx, furniture } from '@/db'
import { conflict, requireEntity } from '@/lib/errors'
import { newId } from '@/lib/id'
import { idParam, mm, name, uuid, validate } from '@/lib/validate'

const furnitureFields = z.object({
    name,
    type: z.string().trim().min(1).max(50),
    width: mm,
    length: mm,
    height: mm,
})
const furnitureBody = furnitureFields.extend({ id: uuid.optional() })

export function requireFurniture(db: DbOrTx, id: string, userId: string) {
    return requireEntity(
        db
            .select()
            .from(furniture)
            .where(and(eq(furniture.id, id), eq(furniture.ownerId, userId)))
            .get(),
        'Furniture',
    )
}

export const furnitureRoutes = new Hono<AppEnv>()
    .get('/furniture', (c) =>
        c.json(
            c.var.db
                .select()
                .from(furniture)
                .where(eq(furniture.ownerId, c.var.user.id))
                .orderBy(asc(furniture.createdAt))
                .all(),
        ),
    )
    .post('/furniture', validate('json', furnitureBody), (c) => {
        const body = c.req.valid('json')
        const db = c.var.db
        const userId = c.var.user.id

        if (body.id) {
            const existing = db.select().from(furniture).where(eq(furniture.id, body.id)).get()
            if (existing?.ownerId === userId) return c.json(existing)
            if (existing) throw conflict('Furniture id already in use')
        }

        const item = db
            .insert(furniture)
            .values({ ...body, id: body.id ?? newId(), ownerId: userId })
            .returning()
            .get()
        return c.json(item, 201)
    })
    .patch(
        '/furniture/:id',
        validate('param', idParam),
        validate('json', furnitureFields.partial()),
        (c) => {
            const db = c.var.db
            const item = requireFurniture(db, c.req.valid('param').id, c.var.user.id)
            const updated = db
                .update(furniture)
                .set(c.req.valid('json'))
                .where(eq(furniture.id, item.id))
                .returning()
                .get()
            return c.json(updated)
        },
    )
    .delete('/furniture/:id', validate('param', idParam), (c) => {
        const db = c.var.db
        const item = requireFurniture(db, c.req.valid('param').id, c.var.user.id)
        db.delete(furniture).where(eq(furniture.id, item.id)).run()
        return c.body(null, 204)
    })
    .post('/furniture/:id/duplicate', validate('param', idParam), (c) => {
        const db = c.var.db
        const item = requireFurniture(db, c.req.valid('param').id, c.var.user.id)
        const copy = db
            .insert(furniture)
            .values({
                ...item,
                id: newId(),
                name: `${item.name} (copy)`,
                createdAt: undefined,
                updatedAt: undefined,
            })
            .returning()
            .get()
        return c.json(copy, 201)
    })
