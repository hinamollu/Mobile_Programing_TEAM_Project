import { describe, expect, it } from 'bun:test'

import { createTestApp } from './helpers'

const roomBody = {
    name: 'Bedroom',
    width: 3000,
    length: 4000,
    openings: [
        { kind: 'door', wall: 's', offset: 200, width: 900, hinge: 'left', swing: 'in' },
        { kind: 'window', wall: 'n', offset: 1000, width: 1200, height: 1000, sillHeight: 900 },
    ],
}

describe('rooms', () => {
    it('creates, lists, updates and deletes rooms with openings', async () => {
        const t = createTestApp()
        const { token } = await t.signup()

        const created = await t.request('POST', '/rooms', { token, body: roomBody })
        expect(created.status).toBe(201)
        expect(created.body.openings).toHaveLength(2)

        const list = await t.request('GET', '/rooms', { token })
        expect(list.body).toHaveLength(1)

        const patched = await t.request('PATCH', `/rooms/${created.body.id}`, {
            token,
            body: { name: 'Study' },
        })
        expect(patched.body).toMatchObject({ name: 'Study', width: 3000 })

        const added = await t.request('POST', `/rooms/${created.body.id}/openings`, {
            token,
            body: { kind: 'outlet', wall: 'e', offset: 500, width: 100 },
        })
        expect(added.status).toBe(201)

        const moved = await t.request('PATCH', `/openings/${added.body.id}`, {
            token,
            body: { offset: 800 },
        })
        expect(moved.body.offset).toBe(800)

        expect((await t.request('DELETE', `/openings/${added.body.id}`, { token })).status).toBe(
            204,
        )
        expect((await t.request('DELETE', `/rooms/${created.body.id}`, { token })).status).toBe(204)
        expect((await t.request('GET', `/rooms/${created.body.id}`, { token })).status).toBe(404)
    })

    it('treats a retried create with the same id as idempotent', async () => {
        const t = createTestApp()
        const { token } = await t.signup()
        const id = crypto.randomUUID()
        const first = await t.request('POST', '/rooms', { token, body: { ...roomBody, id } })
        const second = await t.request('POST', '/rooms', { token, body: { ...roomBody, id } })
        expect(first.status).toBe(201)
        expect(second.status).toBe(200)
        expect(second.body.id).toBe(id)
        expect((await t.request('GET', '/rooms', { token })).body).toHaveLength(1)
    })

    it('validates bodies', async () => {
        const t = createTestApp()
        const { token } = await t.signup()
        const invalid = await t.request('POST', '/rooms', {
            token,
            body: { name: 'x', width: 0, length: 1.5 },
        })
        expect(invalid.status).toBe(400)
        expect(invalid.body.error.code).toBe('validation_error')

        const room = (await t.request('POST', '/rooms', { token, body: roomBody })).body
        const empty = await t.request('PATCH', `/rooms/${room.id}`, { token, body: {} })
        expect(empty.status).toBe(400)
    })

    it("hides other users' rooms and openings", async () => {
        const t = createTestApp()
        const alice = await t.signup('alice')
        const bob = await t.signup('bob')
        const room = (await t.request('POST', '/rooms', { token: alice.token, body: roomBody }))
            .body
        const openingId = room.openings[0].id

        expect((await t.request('GET', `/rooms/${room.id}`, { token: bob.token })).status).toBe(404)
        expect((await t.request('GET', '/rooms', { token: bob.token })).body).toHaveLength(0)
        const patch = await t.request('PATCH', `/rooms/${room.id}`, {
            token: bob.token,
            body: { name: 'mine' },
        })
        expect(patch.status).toBe(404)
        const move = await t.request('PATCH', `/openings/${openingId}`, {
            token: bob.token,
            body: { offset: 0 },
        })
        expect(move.status).toBe(404)
        expect((await t.request('DELETE', `/rooms/${room.id}`, { token: bob.token })).status).toBe(
            404,
        )
    })
})
