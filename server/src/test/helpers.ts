import { createApp } from '@/app'
import { openDatabase } from '@/db'

export type TestApp = ReturnType<typeof createTestApp>

export function createTestApp() {
    const app = createApp(openDatabase({ path: ':memory:' }).db)

    async function request(
        method: string,
        path: string,
        options: { token?: string; body?: unknown } = {},
    ) {
        const headers: Record<string, string> = {}
        if (options.token) headers.authorization = `Bearer ${options.token}`
        if (options.body !== undefined) headers['content-type'] = 'application/json'
        const response = await app.request(`/api/v1${path}`, {
            method,
            headers,
            body: options.body === undefined ? undefined : JSON.stringify(options.body),
        })
        const text = await response.text()
        const body: any = text ? JSON.parse(text) : null
        return { status: response.status, body }
    }

    async function signup(name = 'user') {
        const { body } = await request('POST', '/auth/signup', {
            body: { email: `${name}@example.com`, password: 'password123', displayName: name },
        })
        return { token: body.token as string, user: body.user as { id: string; email: string } }
    }

    async function createProject(token: string, name = 'Project') {
        const room = await request('POST', '/rooms', {
            token,
            body: {
                name: 'Room',
                width: 3000,
                length: 4000,
                openings: [{ kind: 'door', wall: 's', offset: 200, width: 900 }],
            },
        })
        const project = await request('POST', '/projects', {
            token,
            body: { name, baseRoomId: room.body.id },
        })
        return { room: room.body, snapshot: project.body }
    }

    async function revision(token: string, projectId: string) {
        return (await request('GET', `/projects/${projectId}/revision`, { token })).body
            .revision as number
    }

    return { app, request, signup, createProject, revision }
}
