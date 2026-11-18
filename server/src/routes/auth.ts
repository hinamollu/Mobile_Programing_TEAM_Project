import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import type { AppEnv } from '@/context'
import { type Db, sessions, users } from '@/db'
import { env } from '@/env'
import { conflict, unauthorized } from '@/lib/errors'
import { newId } from '@/lib/id'
import { validate } from '@/lib/validate'
import { hashToken } from '@/middleware/auth'
import { toUser } from '@/services/users'

const email = z.string().trim().toLowerCase().pipe(z.email())
const displayName = z.string().trim().min(1).max(50)

const signupBody = z.object({ email, password: z.string().min(8).max(200), displayName })
const loginBody = z.object({ email, password: z.string() })
const meBody = z.object({ displayName })

function createSession(db: Db, userId: string) {
    const token = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64url')
    db.insert(sessions)
        .values({
            tokenHash: hashToken(token),
            userId,
            expiresAt: Date.now() + env.sessionTtlDays * 24 * 60 * 60 * 1000,
        })
        .run()
    return token
}

export const publicAuth = new Hono<AppEnv>()
    .post('/auth/signup', validate('json', signupBody), async (c) => {
        const body = c.req.valid('json')
        const db = c.var.db
        if (db.select({ id: users.id }).from(users).where(eq(users.email, body.email)).get()) {
            throw conflict('Email already registered')
        }

        const user = db
            .insert(users)
            .values({
                id: newId(),
                email: body.email,
                passwordHash: await Bun.password.hash(body.password),
                displayName: body.displayName,
            })
            .returning()
            .get()
        return c.json({ token: createSession(db, user.id), user: toUser(user) }, 201)
    })
    .post('/auth/login', validate('json', loginBody), async (c) => {
        const body = c.req.valid('json')
        const db = c.var.db
        const user = db.select().from(users).where(eq(users.email, body.email)).get()
        if (!user || !(await Bun.password.verify(body.password, user.passwordHash))) {
            throw unauthorized('Invalid email or password')
        }
        return c.json({ token: createSession(db, user.id), user: toUser(user) })
    })

export const auth = new Hono<AppEnv>()
    .post('/auth/logout', (c) => {
        c.var.db.delete(sessions).where(eq(sessions.tokenHash, c.var.tokenHash)).run()
        return c.body(null, 204)
    })
    .get('/me', (c) => c.json(c.var.user))
    .patch('/me', validate('json', meBody), (c) => {
        const user = c.var.db
            .update(users)
            .set(c.req.valid('json'))
            .where(eq(users.id, c.var.user.id))
            .returning()
            .get()!
        return c.json(toUser(user))
    })
