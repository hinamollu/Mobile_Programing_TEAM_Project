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

    return { app, request, signup }
}
