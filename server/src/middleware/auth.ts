import { and, eq, gt } from 'drizzle-orm'
import { createMiddleware } from 'hono/factory'

import type { AppEnv } from '@/context'
import { sessions, users } from '@/db'
import { unauthorized } from '@/lib/errors'
import { userColumns } from '@/services/users'

export const hashToken = (token: string) =>
    new Bun.CryptoHasher('sha256').update(token).digest('hex')

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
    const token = c.req.header('authorization')?.match(/^Bearer (.+)$/)?.[1]
    if (!token) throw unauthorized()

    const tokenHash = hashToken(token)
    const user = c.var.db
        .select(userColumns)
        .from(sessions)
        .innerJoin(users, eq(users.id, sessions.userId))
        .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, Date.now())))
        .get()
    if (!user) throw unauthorized()

    c.set('user', user)
    c.set('tokenHash', tokenHash)
    await next()
})
