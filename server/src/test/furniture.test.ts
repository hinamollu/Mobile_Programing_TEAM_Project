import { describe, expect, it } from 'bun:test'

import { createTestApp } from './helpers'

const desk = { name: 'Desk', type: 'desk', width: 1200, length: 600, height: 750 }

describe('furniture', () => {
    it('creates, updates, duplicates and deletes furniture', async () => {
        const t = createTestApp()
        const { token } = await t.signup()

        const created = await t.request('POST', '/furniture', { token, body: desk })
        expect(created.status).toBe(201)

        const patched = await t.request('PATCH', `/furniture/${created.body.id}`, {
            token,
            body: { width: 1400 },
        })
        expect(patched.body).toMatchObject({ name: 'Desk', width: 1400 })

        const copy = await t.request('POST', `/furniture/${created.body.id}/duplicate`, { token })
        expect(copy.status).toBe(201)
        expect(copy.body).toMatchObject({ name: 'Desk (copy)', width: 1400 })
        expect(copy.body.id).not.toBe(created.body.id)

        expect((await t.request('GET', '/furniture', { token })).body).toHaveLength(2)
        expect((await t.request('DELETE', `/furniture/${created.body.id}`, { token })).status).toBe(
            204,
        )
        expect((await t.request('GET', '/furniture', { token })).body).toHaveLength(1)
    })

    it('validates bodies', async () => {
        const t = createTestApp()
        const { token } = await t.signup()
        const invalid = await t.request('POST', '/furniture', {
            token,
            body: { ...desk, height: -1 },
        })
        expect(invalid.status).toBe(400)
    })

    it("hides other users' furniture", async () => {
        const t = createTestApp()
        const alice = await t.signup('alice')
        const bob = await t.signup('bob')
        const item = (await t.request('POST', '/furniture', { token: alice.token, body: desk }))
            .body

        expect((await t.request('GET', '/furniture', { token: bob.token })).body).toHaveLength(0)
        for (const [method, path, body] of [
            ['PATCH', `/furniture/${item.id}`, { name: 'x' }],
            ['DELETE', `/furniture/${item.id}`, undefined],
            ['POST', `/furniture/${item.id}/duplicate`, undefined],
        ] as const) {
            expect((await t.request(method, path, { token: bob.token, body })).status).toBe(404)
        }
    })
})
