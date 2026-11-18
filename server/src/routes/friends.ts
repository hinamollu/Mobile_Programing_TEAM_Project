import { and, eq, inArray, or } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import type { AppEnv } from '@/context'
import { friendships, users } from '@/db'
import { badRequest, conflict, requireEntity } from '@/lib/errors'
import { userIdParam, validate } from '@/lib/validate'
import { userColumns } from '@/services/users'

const requestBody = z.object({ email: z.string().trim().toLowerCase().pipe(z.email()) })

export const between = (a: string, b: string) =>
    or(
        and(eq(friendships.requesterId, a), eq(friendships.addresseeId, b)),
        and(eq(friendships.requesterId, b), eq(friendships.addresseeId, a)),
    )

export const friendRoutes = new Hono<AppEnv>()
    .get('/friends', (c) => {
        const db = c.var.db
        const me = c.var.user.id
        const rows = db
            .select()
            .from(friendships)
            .where(or(eq(friendships.requesterId, me), eq(friendships.addresseeId, me)))
            .all()
        const otherId = (row: (typeof rows)[number]) =>
            row.requesterId === me ? row.addresseeId : row.requesterId
        const others =
            rows.length === 0
                ? []
                : db
                      .select(userColumns)
                      .from(users)
                      .where(inArray(users.id, rows.map(otherId)))
                      .all()
        const userOf = (row: (typeof rows)[number]) => others.find((u) => u.id === otherId(row))!

        return c.json({
            friends: rows.filter((r) => r.status === 'accepted').map(userOf),
            incoming: rows
                .filter((r) => r.status === 'pending' && r.addresseeId === me)
                .map(userOf),
            outgoing: rows
                .filter((r) => r.status === 'pending' && r.requesterId === me)
                .map(userOf),
        })
    })
    .post('/friends/requests', validate('json', requestBody), (c) => {
        const db = c.var.db
        const me = c.var.user.id
        const user = requireEntity(
            db
                .select(userColumns)
                .from(users)
                .where(eq(users.email, c.req.valid('json').email))
                .get(),
            'User',
        )
        if (user.id === me) throw badRequest('Cannot send a friend request to yourself')

        const existing = db.select().from(friendships).where(between(me, user.id)).get()
        if (existing?.status === 'pending' && existing.requesterId === user.id) {
            db.update(friendships).set({ status: 'accepted' }).where(between(me, user.id)).run()
            return c.json({ status: 'accepted', user })
        }
        if (existing) throw conflict('Friend request already exists')

        db.insert(friendships)
            .values({ requesterId: me, addresseeId: user.id, status: 'pending' })
            .run()
        return c.json({ status: 'pending', user }, 201)
    })
    .post('/friends/requests/:userId/accept', validate('param', userIdParam), (c) => {
        const db = c.var.db
        const { userId } = c.req.valid('param')
        const where = and(
            eq(friendships.requesterId, userId),
            eq(friendships.addresseeId, c.var.user.id),
            eq(friendships.status, 'pending'),
        )
        requireEntity(db.select().from(friendships).where(where).get(), 'Friend request')
        db.update(friendships).set({ status: 'accepted' }).where(where).run()

        const user = db.select(userColumns).from(users).where(eq(users.id, userId)).get()
        return c.json({ status: 'accepted', user })
    })
    .delete('/friends/:userId', validate('param', userIdParam), (c) => {
        const deleted = c.var.db
            .delete(friendships)
            .where(between(c.var.user.id, c.req.valid('param').userId))
            .returning()
            .all()
        requireEntity(deleted[0], 'Friend')
        return c.body(null, 204)
    })
