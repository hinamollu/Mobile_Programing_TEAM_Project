import { describe, expect, it } from 'bun:test'

import { createTestApp, type TestApp } from './helpers'

async function befriend(
    t: TestApp,
    a: { token: string },
    b: { token: string; user: { id: string; email: string } },
) {
    await t.request('POST', '/friends/requests', { token: a.token, body: { email: b.user.email } })
    const me = await t.request('GET', '/me', { token: a.token })
    await t.request('POST', `/friends/requests/${me.body.id}/accept`, { token: b.token })
}

describe('invites', () => {
    it('runs the full invite flow', async () => {
        const t = createTestApp()
        const alice = await t.signup('alice')
        const bob = await t.signup('bob')
        const { snapshot } = await t.createProject(alice.token)
        const projectId = snapshot.project.id
        const layoutId = snapshot.layouts[0].id

        const notFriend = await t.request('POST', `/projects/${projectId}/invites`, {
            token: alice.token,
            body: { userId: bob.user.id },
        })
        expect(notFriend.status).toBe(403)

        await befriend(t, alice, bob)
        const invited = await t.request('POST', `/projects/${projectId}/invites`, {
            token: alice.token,
            body: { userId: bob.user.id },
        })
        expect(invited.status).toBe(201)
        expect(invited.body).toMatchObject({ role: 'editor', status: 'invited' })

        const again = await t.request('POST', `/projects/${projectId}/invites`, {
            token: alice.token,
            body: { userId: bob.user.id },
        })
        expect(again.status).toBe(409)

        expect(
            (await t.request('GET', `/projects/${projectId}`, { token: bob.token })).status,
        ).toBe(404)
        const invites = await t.request('GET', '/invites', { token: bob.token })
        expect(invites.body).toMatchObject([
            { projectId, projectName: 'Project', invitedBy: { id: alice.user.id } },
        ])

        const accepted = await t.request('POST', `/invites/${projectId}/accept`, {
            token: bob.token,
        })
        expect(accepted.body.status).toBe('active')
        expect((await t.request('GET', '/invites', { token: bob.token })).body).toHaveLength(0)

        const placed = await t.request('POST', `/layouts/${layoutId}/placements`, {
            token: bob.token,
            body: {
                name: 'Chair',
                type: 'chair',
                width: 500,
                length: 500,
                height: 900,
                x: 10,
                y: 10,
            },
        })
        expect(placed.status).toBe(201)

        const rename = await t.request('PATCH', `/projects/${projectId}`, {
            token: bob.token,
            body: { name: 'Mine' },
        })
        expect(rename.status).toBe(403)

        const view = await t.request('GET', `/projects/${projectId}`, { token: alice.token })
        expect(view.body.layouts[0].placements).toHaveLength(1)
        expect(view.body.members).toHaveLength(2)

        const removed = await t.request('DELETE', `/projects/${projectId}/members/${bob.user.id}`, {
            token: alice.token,
        })
        expect(removed.status).toBe(204)
        expect(
            (await t.request('GET', `/projects/${projectId}`, { token: bob.token })).status,
        ).toBe(404)
        const edit = await t.request('PATCH', `/placements/${placed.body.id}`, {
            token: bob.token,
            body: { x: 0 },
        })
        expect(edit.status).toBe(404)
    })

    it('lets invitees decline and members leave', async () => {
        const t = createTestApp()
        const alice = await t.signup('alice')
        const bob = await t.signup('bob')
        const { snapshot } = await t.createProject(alice.token)
        const projectId = snapshot.project.id
        await befriend(t, alice, bob)

        const invite = () =>
            t.request('POST', `/projects/${projectId}/invites`, {
                token: alice.token,
                body: { userId: bob.user.id },
            })
        await invite()
        expect(
            (await t.request('POST', `/invites/${projectId}/decline`, { token: bob.token })).status,
        ).toBe(204)
        expect(
            (await t.request('POST', `/invites/${projectId}/accept`, { token: bob.token })).status,
        ).toBe(404)

        await invite()
        await t.request('POST', `/invites/${projectId}/accept`, { token: bob.token })
        const leave = await t.request('DELETE', `/projects/${projectId}/members/${bob.user.id}`, {
            token: bob.token,
        })
        expect(leave.status).toBe(204)

        const ownerLeave = await t.request(
            'DELETE',
            `/projects/${projectId}/members/${alice.user.id}`,
            {
                token: alice.token,
            },
        )
        expect(ownerLeave.status).toBe(403)
    })

    it('increases the revision on every project write', async () => {
        const t = createTestApp()
        const alice = await t.signup('alice')
        const bob = await t.signup('bob')
        const { snapshot } = await t.createProject(alice.token)
        const projectId = snapshot.project.id
        const layoutId = snapshot.layouts[0].id
        await befriend(t, alice, bob)

        let last = await t.revision(alice.token, projectId)
        const writes: [string, string, string, unknown?][] = [
            [alice.token, 'PATCH', `/projects/${projectId}`, { name: 'Renamed' }],
            [alice.token, 'PATCH', `/openings/${snapshot.room.openings[0].id}`, { offset: 10 }],
            [
                alice.token,
                'POST',
                `/rooms/${snapshot.room.id}/openings`,
                { kind: 'outlet', wall: 'n', offset: 0, width: 80 },
            ],
            [alice.token, 'POST', `/projects/${projectId}/layouts`, { name: 'Layout 2' }],
            [alice.token, 'PATCH', `/layouts/${layoutId}`, { name: 'Main' }],
            [alice.token, 'POST', `/layouts/${layoutId}/duplicate`],
            [alice.token, 'POST', `/projects/${projectId}/invites`, { userId: bob.user.id }],
            [bob.token, 'POST', `/invites/${projectId}/accept`],
        ]
        for (const [token, method, path, body] of writes) {
            const response = await t.request(method, path, { token, body })
            expect(response.status).toBeLessThan(300)
            const revision = await t.revision(alice.token, projectId)
            expect(revision).toBe(last + 1)
            last = revision
        }
    })
})
