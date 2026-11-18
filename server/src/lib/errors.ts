import type { ErrorHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

export type ErrorCode =
    | 'bad_request'
    | 'validation_error'
    | 'unauthorized'
    | 'forbidden'
    | 'not_found'
    | 'conflict'
    | 'internal'

export class ApiError extends Error {
    constructor(
        readonly status: ContentfulStatusCode,
        readonly code: ErrorCode,
        message: string,
        readonly issues?: unknown,
    ) {
        super(message)
        this.name = 'ApiError'
    }
}

export const badRequest = (message: string) => new ApiError(400, 'bad_request', message)
export const unauthorized = (message = 'Unauthorized') => new ApiError(401, 'unauthorized', message)
export const forbidden = (message: string) => new ApiError(403, 'forbidden', message)
export const notFound = (what: string) => new ApiError(404, 'not_found', `${what} not found`)
export const conflict = (message: string) => new ApiError(409, 'conflict', message)

export function requireEntity<T>(entity: T | null | undefined, what: string): T {
    if (entity === null || entity === undefined) throw notFound(what)
    return entity
}

export function errorBody(error: ApiError) {
    return {
        error: {
            code: error.code,
            message: error.message,
            ...(error.issues === undefined ? {} : { issues: error.issues }),
        },
    }
}

export const errorHandler: ErrorHandler = (error, c) => {
    if (error instanceof ApiError) return c.json(errorBody(error), error.status)
    if (error instanceof HTTPException) {
        return c.json(
            errorBody(new ApiError(error.status, 'bad_request', error.message)),
            error.status,
        )
    }
    console.error(error)
    return c.json(errorBody(new ApiError(500, 'internal', 'Internal server error')), 500)
}
