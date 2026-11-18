import { describe, expect, it } from 'bun:test'

import { createTestApp } from './helpers'

describe('auth', () => {
    it('signs up, logs in and reads the current user', async () => {
        const t = createTestApp()
        const signup = await t.request('POST', '/auth/signup', {
            body: { email: ' Alice@Example.com ', password: 'password123', displayName: 'Alice' },
        })
        expect(signup.status).toBe(201)
        expect(signup.body.user).toMatchObject({ email: 'alice@example.com', displayName: 'Alice' })
        expect(signup.body.user.passwordHash).toBeUndefined()

        const login = await t.request('POST', '/auth/login', {
            body: { email: 'alice@example.com', password: 'password123' },
        })
        expect(login.status).toBe(200)

        const me = await t.request('GET', '/me', { token: login.body.token })
        expect(me.body).toMatchObject({ id: signup.body.user.id, displayName: 'Alice' })
        expect(typeof me.body.createdAt).toBe('number')
    })

    it('rejects duplicate emails, bad passwords and invalid bodies', async () => {
        const t = createTestApp()
        await t.signup('alice')
        const duplicate = await t.request('POST', '/auth/signup', {
            body: { email: 'alice@example.com', password: 'password123', displayName: 'A' },
        })
        expect(duplicate.status).toBe(409)

        const wrong = await t.request('POST', '/auth/login', {
            body: { email: 'alice@example.com', password: 'wrong-password' },
        })
        expect(wrong.status).toBe(401)

        const invalid = await t.request('POST', '/auth/signup', {
            body: { email: 'nope', password: 'short', displayName: '' },
        })
        expect(invalid.status).toBe(400)
        expect(invalid.body.error.code).toBe('validation_error')
        expect(invalid.body.error.issues.length).toBeGreaterThan(0)
    })

    it('requires a valid token and invalidates it on logout', async () => {
        const t = createTestApp()
        const { token } = await t.signup()
        expect((await t.request('GET', '/me')).status).toBe(401)
        expect((await t.request('GET', '/me', { token: 'bogus' })).status).toBe(401)

        const patched = await t.request('PATCH', '/me', { token, body: { displayName: 'Renamed' } })
        expect(patched.body.displayName).toBe('Renamed')

        expect((await t.request('POST', '/auth/logout', { token })).status).toBe(204)
        expect((await t.request('GET', '/me', { token })).status).toBe(401)
    })
})
