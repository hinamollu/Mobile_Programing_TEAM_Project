import { and, asc, eq } from 'drizzle-orm'
import { alias } from 'drizzle-orm/sqlite-core'
import { Hono } from 'hono'
import { z } from 'zod'

import type { AppEnv } from '@/context'
import { friendships, projectMembers, projects, users } from '@/db'
import { conflict, forbidden, requireEntity } from '@/lib/errors'
import { idParam, uuid, validate } from '@/lib/validate'
import { requireProjectRole } from '@/services/access'
import { bumpRevision } from '@/services/revision'

import { between } from './friends'

const inviteBody = z.object({ userId: uuid })
const projectIdParam = z.object({ projectId: uuid })
const inviters = alias(users, 'inviters')

const invitedRow = (projectId: string, userId: string) =>
    and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId),
        eq(projectMembers.status, 'invited'),
    )

export const inviteRoutes = new Hono<AppEnv>()
    .post(
        '/projects/:id/invites',
        validate('param', idParam),
        validate('json', inviteBody),
        (c) => {
            const db = c.var.db
            const projectId = c.req.valid('param').id
            const { userId } = c.req.valid('json')
            const me = c.var.user.id
            requireProjectRole(db, projectId, me, 'owner')

            const friendship = db
                .select()
                .from(friendships)
                .where(and(eq(friendships.status, 'accepted'), between(me, userId)))
                .get()
            if (!friendship) throw forbidden('Only friends can be invited')

            const existing = db
                .select()
                .from(projectMembers)
                .where(
                    and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)),
                )
                .get()
            if (existing) throw conflict('User is already invited or a member')

            return db.transaction((tx) => {
                const member = tx
                    .insert(projectMembers)
                    .values({ projectId, userId, role: 'editor', status: 'invited', invitedBy: me })
                    .returning()
                    .get()
                return c.json({ ...member, revision: bumpRevision(tx, projectId) }, 201)
            })
        },
    )
    .get('/invites', (c) => {
        const list = c.var.db
            .select({
                projectId: projects.id,
                projectName: projects.name,
                invitedBy: {
                    id: inviters.id,
                    email: inviters.email,
                    displayName: inviters.displayName,
                },
                createdAt: projectMembers.createdAt,
            })
            .from(projectMembers)
            .innerJoin(projects, eq(projects.id, projectMembers.projectId))
            .leftJoin(inviters, eq(inviters.id, projectMembers.invitedBy))
            .where(
                and(eq(projectMembers.userId, c.var.user.id), eq(projectMembers.status, 'invited')),
            )
            .orderBy(asc(projectMembers.createdAt))
            .all()
        return c.json(list)
    })
    .post('/invites/:projectId/accept', validate('param', projectIdParam), (c) => {
        const db = c.var.db
        const { projectId } = c.req.valid('param')
        const where = invitedRow(projectId, c.var.user.id)
        requireEntity(db.select().from(projectMembers).where(where).get(), 'Invite')

        return db.transaction((tx) => {
            const member = tx
                .update(projectMembers)
                .set({ status: 'active' })
                .where(where)
                .returning()
                .get()
            return c.json({ ...member, revision: bumpRevision(tx, projectId) })
        })
    })
    .post('/invites/:projectId/decline', validate('param', projectIdParam), (c) => {
        const db = c.var.db
        const { projectId } = c.req.valid('param')
        const where = invitedRow(projectId, c.var.user.id)
        requireEntity(db.select().from(projectMembers).where(where).get(), 'Invite')

        db.transaction((tx) => {
            tx.delete(projectMembers).where(where).run()
            bumpRevision(tx, projectId)
        })
        return c.body(null, 204)
    })
