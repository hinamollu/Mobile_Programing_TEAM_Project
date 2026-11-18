import { describe, expect, it } from 'bun:test'

import { createTestApp } from './helpers'

describe('friends', () => {
    it('sends, accepts and removes friend requests', async () => {
        const t = createTestApp()
        const alice = await t.signup('alice')
        const bob = await t.signup('bob')

        const sent = await t.request('POST', '/friends/requests', {
            token: alice.token,
            body: { email: 'BOB@example.com' },
        })
        expect(sent.status).toBe(201)
        expect(sent.body).toMatchObject({ status: 'pending', user: { id: bob.user.id } })

        expect((await t.request('GET', '/friends', { token: alice.token })).body).toMatchObject({
            friends: [],
            outgoing: [{ id: bob.user.id }],
        })
        expect((await t.request('GET', '/friends', { token: bob.token })).body).toMatchObject({
            incoming: [{ id: alice.user.id }],
        })

        const accepted = await t.request('POST', `/friends/requests/${alice.user.id}/accept`, {
            token: bob.token,
        })
        expect(accepted.body.status).toBe('accepted')
        const friends = await t.request('GET', '/friends', { token: alice.token })
        expect(friends.body).toEqual({
            friends: [expect.objectContaining({ id: bob.user.id })],
            incoming: [],
            outgoing: [],
        })

        expect(
            (await t.request('DELETE', `/friends/${alice.user.id}`, { token: bob.token })).status,
        ).toBe(204)
        expect(
            (await t.request('GET', '/friends', { token: alice.token })).body.friends,
        ).toHaveLength(0)
    })

    it('auto-accepts a mutual request and rejects duplicates', async () => {
        const t = createTestApp()
        const alice = await t.signup('alice')
        const bob = await t.signup('bob')

        await t.request('POST', '/friends/requests', {
            token: alice.token,
            body: { email: 'bob@example.com' },
        })
        const duplicate = await t.request('POST', '/friends/requests', {
            token: alice.token,
            body: { email: 'bob@example.com' },
        })
        expect(duplicate.status).toBe(409)

        const mutual = await t.request('POST', '/friends/requests', {
            token: bob.token,
            body: { email: 'alice@example.com' },
        })
        expect(mutual.body.status).toBe('accepted')
    })

    it('validates requests', async () => {
        const t = createTestApp()
        const alice = await t.signup('alice')
        const missing = await t.request('POST', '/friends/requests', {
            token: alice.token,
            body: { email: 'nobody@example.com' },
        })
        expect(missing.status).toBe(404)
        const self = await t.request('POST', '/friends/requests', {
            token: alice.token,
            body: { email: 'alice@example.com' },
        })
        expect(self.status).toBe(400)
        const invalid = await t.request('POST', '/friends/requests', {
            token: alice.token,
            body: {},
        })
        expect(invalid.body.error.code).toBe('validation_error')
        const accept = await t.request('POST', `/friends/requests/${crypto.randomUUID()}/accept`, {
            token: alice.token,
        })
        expect(accept.status).toBe(404)
    })
})
