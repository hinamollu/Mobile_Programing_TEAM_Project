import { Hono } from 'hono'
import { logger } from 'hono/logger'

import type { AppEnv } from './context'
import type { Db } from './db'
import { errorBody, errorHandler, notFound } from './lib/errors'
import { requireAuth } from './middleware/auth'
import { auth, publicAuth } from './routes/auth'
import { friendRoutes } from './routes/friends'
import { furnitureRoutes } from './routes/furniture'
import { inviteRoutes } from './routes/invites'
import { layoutRoutes } from './routes/layouts'
import { placementRoutes } from './routes/placements'
import { projectRoutes } from './routes/projects'
import { roomRoutes } from './routes/rooms'

export function createApp(db: Db) {
    const app = new Hono<AppEnv>()

    if (process.env.NODE_ENV !== 'test') app.use(logger())
    app.use(async (c, next) => {
        c.set('db', db)
        await next()
    })
    app.onError(errorHandler)
    app.notFound((c) => c.json(errorBody(notFound('Route')), 404))

    const api = new Hono<AppEnv>()
    api.route('/', publicAuth)
    api.use(requireAuth)
    api.route('/', auth)
    api.route('/', roomRoutes)
    api.route('/', furnitureRoutes)
    api.route('/', projectRoutes)
    api.route('/', layoutRoutes)
    api.route('/', placementRoutes)
    api.route('/', friendRoutes)
    api.route('/', inviteRoutes)

    app.route('/api/v1', api)
    return app
}
