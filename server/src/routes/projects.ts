import { and, asc, eq, getTableColumns, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import type { AppEnv } from '@/context'
import { layouts, projectMembers, projects, rooms } from '@/db'
import { conflict, forbidden, notFound, requireEntity } from '@/lib/errors'
import { newId } from '@/lib/id'
import { idParam, name, uuid, validate } from '@/lib/validate'
import { requireProjectRole } from '@/services/access'
import { copyLayout } from '@/services/layouts'
import { getSnapshot } from '@/services/projects'
import { bumpRevision } from '@/services/revision'
import { copyRoom } from '@/services/rooms'

const projectBody = z.object({ id: uuid.optional(), name, baseRoomId: uuid })
const projectPatch = z.object({ name })
const memberParam = z.object({ id: uuid, userId: uuid })

export const projectRoutes = new Hono<AppEnv>()
    .get('/projects', (c) => {
        const list = c.var.db
            .select({
                ...getTableColumns(projects),
                role: projectMembers.role,
                memberCount: sql<number>`(SELECT count(*) FROM project_members m WHERE m.project_id = ${projects.id} AND m.status = 'active')`,
                layoutCount: sql<number>`(SELECT count(*) FROM layouts l WHERE l.project_id = ${projects.id})`,
            })
            .from(projects)
            .innerJoin(
                projectMembers,
                and(
                    eq(projectMembers.projectId, projects.id),
                    eq(projectMembers.userId, c.var.user.id),
                    eq(projectMembers.status, 'active'),
                ),
            )
            .orderBy(asc(projects.createdAt))
            .all()
        return c.json(list)
    })
    .post('/projects', validate('json', projectBody), (c) => {
        const body = c.req.valid('json')
        const db = c.var.db
        const userId = c.var.user.id

        if (body.id) {
            const existing = db.select().from(projects).where(eq(projects.id, body.id)).get()
            if (existing?.ownerId === userId) return c.json(getSnapshot(db, existing.id, 'owner'))
            if (existing) throw conflict('Project id already in use')
        }

        const room = db.select().from(rooms).where(eq(rooms.id, body.baseRoomId)).get()
        if (!room || room.ownerId !== userId || room.projectId) throw notFound('Room')

        const projectId = db.transaction((tx) => {
            const project = tx
                .insert(projects)
                .values({ id: body.id ?? newId(), ownerId: userId, name: body.name })
                .returning()
                .get()
            copyRoom(tx, room.id, { ownerId: userId, projectId: project.id })
            tx.insert(projectMembers)
                .values({ projectId: project.id, userId, role: 'owner', status: 'active' })
                .run()
            tx.insert(layouts)
                .values({ id: newId(), projectId: project.id, name: 'Layout 1' })
                .run()
            return project.id
        })
        return c.json(getSnapshot(db, projectId, 'owner'), 201)
    })
    .get('/projects/:id', validate('param', idParam), (c) => {
        const db = c.var.db
        const { id } = c.req.valid('param')
        const member = requireProjectRole(db, id, c.var.user.id, 'editor')
        return c.json(getSnapshot(db, id, member.role))
    })
    .get('/projects/:id/revision', validate('param', idParam), (c) => {
        const db = c.var.db
        const { id } = c.req.valid('param')
        requireProjectRole(db, id, c.var.user.id, 'editor')
        const project = db
            .select({ revision: projects.revision })
            .from(projects)
            .where(eq(projects.id, id))
            .get()
        return c.json(requireEntity(project, 'Project'))
    })
    .patch('/projects/:id', validate('param', idParam), validate('json', projectPatch), (c) => {
        const db = c.var.db
        const { id } = c.req.valid('param')
        requireProjectRole(db, id, c.var.user.id, 'owner')
        const project = db.transaction((tx) => {
            tx.update(projects).set(c.req.valid('json')).where(eq(projects.id, id)).run()
            bumpRevision(tx, id)
            return tx.select().from(projects).where(eq(projects.id, id)).get()!
        })
        return c.json({ ...project, role: 'owner' })
    })
    .delete('/projects/:id', validate('param', idParam), (c) => {
        const db = c.var.db
        const { id } = c.req.valid('param')
        requireProjectRole(db, id, c.var.user.id, 'owner')
        db.delete(projects).where(eq(projects.id, id)).run()
        return c.body(null, 204)
    })
    .post('/projects/:id/duplicate', validate('param', idParam), (c) => {
        const db = c.var.db
        const { id } = c.req.valid('param')
        const userId = c.var.user.id
        requireProjectRole(db, id, userId, 'editor')

        const copyId = db.transaction((tx) => {
            const source = tx.select().from(projects).where(eq(projects.id, id)).get()!
            const copy = tx
                .insert(projects)
                .values({ id: newId(), ownerId: userId, name: `${source.name} (copy)` })
                .returning()
                .get()
            const room = tx
                .select({ id: rooms.id })
                .from(rooms)
                .where(eq(rooms.projectId, id))
                .get()
            if (room) copyRoom(tx, room.id, { ownerId: userId, projectId: copy.id })
            tx.insert(projectMembers)
                .values({ projectId: copy.id, userId, role: 'owner', status: 'active' })
                .run()
            const layoutList = tx
                .select()
                .from(layouts)
                .where(eq(layouts.projectId, id))
                .orderBy(asc(layouts.createdAt))
                .all()
            for (const layout of layoutList) {
                copyLayout(tx, layout, {
                    projectId: copy.id,
                    name: layout.name,
                    createdAt: layout.createdAt,
                })
            }
            return copy.id
        })
        return c.json(getSnapshot(db, copyId, 'owner'), 201)
    })
    .delete('/projects/:id/members/:userId', validate('param', memberParam), (c) => {
        const db = c.var.db
        const { id, userId } = c.req.valid('param')
        const self = c.var.user.id
        requireProjectRole(db, id, self, userId === self ? 'editor' : 'owner')

        const where = and(eq(projectMembers.projectId, id), eq(projectMembers.userId, userId))
        const target = requireEntity(db.select().from(projectMembers).where(where).get(), 'Member')
        if (target.role === 'owner') throw forbidden('The owner cannot leave the project')

        db.transaction((tx) => {
            tx.delete(projectMembers).where(where).run()
            bumpRevision(tx, id)
        })
        return c.body(null, 204)
    })
