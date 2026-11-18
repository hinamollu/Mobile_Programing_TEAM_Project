import { users } from '@/db'

export const userColumns = {
    id: users.id,
    email: users.email,
    displayName: users.displayName,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt,
}

export type User = Omit<typeof users.$inferSelect, 'passwordHash'>

export function toUser(row: typeof users.$inferSelect): User {
    const { passwordHash: _passwordHash, ...user } = row
    return user
}
