import { describe, expect, it } from 'bun:test'

import { createTestApp } from './helpers'

describe('projects', () => {
    it('creates a project with a room copy, owner membership and a default layout', async () => {
        const t = createTestApp()
        const { token, user } = await t.signup()
        const { room, snapshot } = await t.createProject(token)

        expect(snapshot.project).toMatchObject({ name: 'Project', role: 'owner', revision: 0 })
        expect(snapshot.room.id).not.toBe(room.id)
        expect(snapshot.room.projectId).toBe(snapshot.project.id)
        expect(snapshot.room.openings).toHaveLength(1)
        expect(snapshot.members).toMatchObject([{ user: { id: user.id }, role: 'owner' }])
        expect(snapshot.layouts).toMatchObject([{ name: 'Layout 1', placements: [] }])

        const list = await t.request('GET', '/projects', { token })
        expect(list.body).toMatchObject([
            { id: snapshot.project.id, role: 'owner', memberCount: 1, layoutCount: 1 },
        ])
        expect((await t.request('GET', '/rooms', { token })).body).toHaveLength(1)
    })

    it('keeps the library room unchanged when a project opening moves', async () => {
        const t = createTestApp()
        const { token } = await t.signup()
        const { room, snapshot } = await t.createProject(token)

        const moved = await t.request('PATCH', `/openings/${snapshot.room.openings[0].id}`, {
            token,
            body: { offset: 1500 },
        })
        expect(moved.body).toMatchObject({ offset: 1500, revision: 1 })

        const library = await t.request('GET', `/rooms/${room.id}`, { token })
        expect(library.body.openings[0].offset).toBe(200)
        expect((await t.request('GET', `/rooms/${snapshot.room.id}`, { token })).status).toBe(404)
    })

    it('renames, duplicates and deletes projects', async () => {
        const t = createTestApp()
        const { token } = await t.signup()
        const { snapshot } = await t.createProject(token)
        const id = snapshot.project.id

        const renamed = await t.request('PATCH', `/projects/${id}`, {
            token,
            body: { name: 'Renamed' },
        })
        expect(renamed.body).toMatchObject({ name: 'Renamed', revision: 1 })

        await t.request('POST', `/layouts/${snapshot.layouts[0].id}/placements`, {
            token,
            body: { name: 'Bed', type: 'bed', width: 1000, length: 2000, height: 500, x: 0, y: 0 },
        })

        const copy = await t.request('POST', `/projects/${id}/duplicate`, { token })
        expect(copy.status).toBe(201)
        expect(copy.body.project).toMatchObject({ name: 'Renamed (copy)', revision: 0 })
        expect(copy.body.room.id).not.toBe(snapshot.room.id)
        expect(copy.body.layouts[0].placements).toHaveLength(1)

        const copyPlacement = copy.body.layouts[0].placements[0]
        await t.request('PATCH', `/placements/${copyPlacement.id}`, { token, body: { x: 900 } })
        const original = await t.request('GET', `/projects/${id}`, { token })
        expect(original.body.layouts[0].placements[0].x).toBe(0)

        expect((await t.request('DELETE', `/projects/${id}`, { token })).status).toBe(204)
        expect((await t.request('GET', `/projects/${id}`, { token })).status).toBe(404)
        expect((await t.request('GET', '/projects', { token })).body).toHaveLength(1)
    })

    it('validates bodies and hides projects from non-members', async () => {
        const t = createTestApp()
        const alice = await t.signup('alice')
        const bob = await t.signup('bob')
        const { room, snapshot } = await t.createProject(alice.token)
        const id = snapshot.project.id

        const invalid = await t.request('POST', '/projects', {
            token: alice.token,
            body: { name: '', baseRoomId: 'nope' },
        })
        expect(invalid.status).toBe(400)

        const foreignRoom = await t.request('POST', '/projects', {
            token: bob.token,
            body: { name: 'Mine', baseRoomId: room.id },
        })
        expect(foreignRoom.status).toBe(404)

        for (const [method, path] of [
            ['GET', `/projects/${id}`],
            ['GET', `/projects/${id}/revision`],
            ['DELETE', `/projects/${id}`],
            ['POST', `/projects/${id}/duplicate`],
        ]) {
            expect((await t.request(method!, path!, { token: bob.token })).status).toBe(404)
        }
    })
})
