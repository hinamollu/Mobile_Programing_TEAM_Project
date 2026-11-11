import { asc, eq } from 'drizzle-orm'

import { type DbOrTx, layouts, projectMembers, projects, rooms, users } from '@/db'
import { getRoom } from '@/services/rooms'
import { userColumns } from '@/services/users'

import type { Role } from './access'
import { withPlacements } from './layouts'

export function getSnapshot(db: DbOrTx, projectId: string, role: Role) {
    const project = db.select().from(projects).where(eq(projects.id, projectId)).get()!
    const room = db.select({ id: rooms.id }).from(rooms).where(eq(rooms.projectId, projectId)).get()
    const members = db
        .select({
            user: userColumns,
            role: projectMembers.role,
            status: projectMembers.status,
            invitedBy: projectMembers.invitedBy,
        })
        .from(projectMembers)
        .innerJoin(users, eq(users.id, projectMembers.userId))
        .where(eq(projectMembers.projectId, projectId))
        .orderBy(asc(projectMembers.createdAt))
        .all()
    const layoutList = db
        .select()
        .from(layouts)
        .where(eq(layouts.projectId, projectId))
        .orderBy(asc(layouts.createdAt))
        .all()

    return {
        project: { ...project, role },
        room: room ? getRoom(db, room.id) : null,
        members,
        layouts: withPlacements(db, layoutList),
    }
}
