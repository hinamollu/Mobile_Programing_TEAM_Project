import { zValidator } from '@hono/zod-validator'
import type { ValidationTargets } from 'hono'
import { z } from 'zod'

import { ApiError } from './errors'

export const mm = z.number().int().min(1).max(100_000)
export const coord = z.number().int().min(0).max(100_000)
export const uuid = z.uuid()
export const rotation = z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)])
export const name = z.string().trim().min(1).max(100)

export const partial = <S extends z.ZodObject>(schema: S) =>
    schema.partial().refine((value) => Object.keys(value).length > 0, 'Nothing to update')

export const idParam = z.object({ id: uuid })
export const userIdParam = z.object({ userId: uuid })

export const validate = <T extends keyof ValidationTargets, S extends z.ZodType>(
    target: T,
    schema: S,
) =>
    zValidator(target, schema, (result) => {
        if (!result.success) {
            throw new ApiError(400, 'validation_error', `Invalid ${target}`, result.error.issues)
        }
    })
