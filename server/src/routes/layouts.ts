import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import type { AppEnv } from '@/context'
import { layouts } from '@/db'
import { conflict } from '@/lib/errors'
import { newId } from '@/lib/id'
import { idParam, name, uuid, validate } from '@/lib/validate'
import { requireLayout, requireProjectRole } from '@/services/access'
import { copyLayout } from '@/services/layouts'
import { bumpRevision } from '@/services/revision'

const layoutBody = z.object({ id: uuid.optional(), name })
const layoutPatch = z.object({ name })

export const layoutRoutes = new Hono<AppEnv>()
    .post(
        '/projects/:id/layouts',
        validate('param', idParam),
        validate('json', layoutBody),
        (c) => {
            const db = c.var.db
            const projectId = c.req.valid('param').id
            const body = c.req.valid('json')
            requireProjectRole(db, projectId, c.var.user.id, 'editor')

            if (body.id) {
                const existing = db.select().from(layouts).where(eq(layouts.id, body.id)).get()
                if (existing?.projectId === projectId) return c.json(existing)
                if (existing) throw conflict('Layout id already in use')
            }

            return db.transaction((tx) => {
                const layout = tx
                    .insert(layouts)
                    .values({ id: body.id ?? newId(), projectId, name: body.name })
                    .returning()
                    .get()
                return c.json(
                    { ...layout, placements: [], revision: bumpRevision(tx, projectId) },
                    201,
                )
            })
        },
    )
    .patch('/layouts/:id', validate('param', idParam), validate('json', layoutPatch), (c) => {
        const db = c.var.db
        const layout = requireLayout(db, c.req.valid('param').id, c.var.user.id)
        return db.transaction((tx) => {
            const updated = tx
                .update(layouts)
                .set(c.req.valid('json'))
                .where(eq(layouts.id, layout.id))
                .returning()
                .get()
            return c.json({ ...updated, revision: bumpRevision(tx, layout.projectId) })
        })
    })
    .delete('/layouts/:id', validate('param', idParam), (c) => {
        const db = c.var.db
        const layout = requireLayout(db, c.req.valid('param').id, c.var.user.id)
        db.transaction((tx) => {
            tx.delete(layouts).where(eq(layouts.id, layout.id)).run()
            bumpRevision(tx, layout.projectId)
        })
        return c.body(null, 204)
    })
    .post('/layouts/:id/duplicate', validate('param', idParam), (c) => {
        const db = c.var.db
        const layout = requireLayout(db, c.req.valid('param').id, c.var.user.id)
        return db.transaction((tx) => {
            const copy = copyLayout(tx, layout, {
                projectId: layout.projectId,
                name: `${layout.name} (copy)`,
            })
            return c.json({ ...copy, revision: bumpRevision(tx, layout.projectId) }, 201)
        })
    })
