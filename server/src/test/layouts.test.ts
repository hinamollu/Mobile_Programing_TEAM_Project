import { describe, expect, it } from 'bun:test'

import { createTestApp } from './helpers'

describe('layouts', () => {
    it('creates, renames, duplicates and deletes layouts', async () => {
        const t = createTestApp()
        const { token } = await t.signup()
        const { snapshot } = await t.createProject(token)
        const projectId = snapshot.project.id

        const created = await t.request('POST', `/projects/${projectId}/layouts`, {
            token,
            body: { name: 'Layout 2' },
        })
        expect(created.status).toBe(201)
        expect(created.body.revision).toBe(1)

        const renamed = await t.request('PATCH', `/layouts/${created.body.id}`, {
            token,
            body: { name: 'Cozy' },
        })
        expect(renamed.body).toMatchObject({ name: 'Cozy', revision: 2 })

        await t.request('POST', `/layouts/${created.body.id}/placements`, {
            token,
            body: { name: 'Bed', type: 'bed', width: 1000, length: 2000, height: 500, x: 0, y: 0 },
        })
        const copy = await t.request('POST', `/layouts/${created.body.id}/duplicate`, { token })
        expect(copy.status).toBe(201)
        expect(copy.body.name).toBe('Cozy (copy)')
        expect(copy.body.placements).toHaveLength(1)

        await t.request('DELETE', `/placements/${copy.body.placements[0].id}`, { token })
        const project = await t.request('GET', `/projects/${projectId}`, { token })
        expect(
            project.body.layouts.map((l: { placements: unknown[] }) => l.placements.length),
        ).toEqual([0, 1, 0])

        const list = await t.request('GET', '/projects', { token })
        expect(list.body[0].layoutCount).toBe(3)

        expect((await t.request('DELETE', `/layouts/${created.body.id}`, { token })).status).toBe(
            204,
        )
        expect(
            (
                await t.request('PATCH', `/layouts/${created.body.id}`, {
                    token,
                    body: { name: 'x' },
                })
            ).status,
        ).toBe(404)
    })

    it('validates bodies and hides layouts from non-members', async () => {
        const t = createTestApp()
        const alice = await t.signup('alice')
        const bob = await t.signup('bob')
        const { snapshot } = await t.createProject(alice.token)

        const invalid = await t.request('POST', `/projects/${snapshot.project.id}/layouts`, {
            token: alice.token,
            body: { name: '' },
        })
        expect(invalid.status).toBe(400)

        const layoutId = snapshot.layouts[0].id
        expect(
            (
                await t.request('POST', `/projects/${snapshot.project.id}/layouts`, {
                    token: bob.token,
                    body: { name: 'x' },
                })
            ).status,
        ).toBe(404)
        expect(
            (
                await t.request('PATCH', `/layouts/${layoutId}`, {
                    token: bob.token,
                    body: { name: 'x' },
                })
            ).status,
        ).toBe(404)
        expect(
            (await t.request('POST', `/layouts/${layoutId}/duplicate`, { token: bob.token }))
                .status,
        ).toBe(404)
    })
})
