import { describe, expect, it } from 'bun:test'

import { createTestApp } from './helpers'

const desk = { name: 'Desk', type: 'desk', width: 1200, length: 600, height: 750 }

describe('placements', () => {
    it('places library furniture with a snapshot and moves it', async () => {
        const t = createTestApp()
        const { token } = await t.signup()
        const { snapshot } = await t.createProject(token)
        const layoutId = snapshot.layouts[0].id
        const item = (await t.request('POST', '/furniture', { token, body: desk })).body

        const placed = await t.request('POST', `/layouts/${layoutId}/placements`, {
            token,
            body: { furnitureId: item.id, x: 100, y: 200, rotation: 90 },
        })
        expect(placed.status).toBe(201)
        expect(placed.body).toMatchObject({
            ...desk,
            furnitureId: item.id,
            rotation: 90,
            revision: 1,
        })

        const moved = await t.request('PATCH', `/placements/${placed.body.id}`, {
            token,
            body: { x: 500, rotation: 180 },
        })
        expect(moved.body).toMatchObject({ x: 500, y: 200, rotation: 180, revision: 2 })
    })

    it('keeps placements when their furniture is deleted', async () => {
        const t = createTestApp()
        const { token } = await t.signup()
        const { snapshot } = await t.createProject(token)
        const item = (await t.request('POST', '/furniture', { token, body: desk })).body
        await t.request('POST', `/layouts/${snapshot.layouts[0].id}/placements`, {
            token,
            body: { furnitureId: item.id, x: 0, y: 0 },
        })

        await t.request('DELETE', `/furniture/${item.id}`, { token })
        const project = await t.request('GET', `/projects/${snapshot.project.id}`, { token })
        expect(project.body.layouts[0].placements).toMatchObject([
            { ...desk, furnitureId: null, rotation: 0 },
        ])
    })

    it('validates bodies and access', async () => {
        const t = createTestApp()
        const alice = await t.signup('alice')
        const bob = await t.signup('bob')
        const { snapshot } = await t.createProject(alice.token)
        const layoutId = snapshot.layouts[0].id

        const badRotation = await t.request('POST', `/layouts/${layoutId}/placements`, {
            token: alice.token,
            body: { ...desk, x: 0, y: 0, rotation: 45 },
        })
        expect(badRotation.status).toBe(400)

        const bobItem = (await t.request('POST', '/furniture', { token: bob.token, body: desk }))
            .body
        const foreignFurniture = await t.request('POST', `/layouts/${layoutId}/placements`, {
            token: alice.token,
            body: { furnitureId: bobItem.id, x: 0, y: 0 },
        })
        expect(foreignFurniture.status).toBe(404)

        const placed = await t.request('POST', `/layouts/${layoutId}/placements`, {
            token: alice.token,
            body: { ...desk, x: 0, y: 0 },
        })
        expect(
            (
                await t.request('PATCH', `/placements/${placed.body.id}`, {
                    token: bob.token,
                    body: { x: 1 },
                })
            ).status,
        ).toBe(404)
        expect(
            (await t.request('DELETE', `/placements/${placed.body.id}`, { token: bob.token }))
                .status,
        ).toBe(404)
    })
})
