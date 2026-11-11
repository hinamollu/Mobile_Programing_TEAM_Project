import { eq, sql } from 'drizzle-orm'

import { type DbOrTx, projects } from '@/db'

export function bumpRevision(tx: DbOrTx, projectId: string) {
    return tx
        .update(projects)
        .set({ revision: sql`${projects.revision} + 1` })
        .where(eq(projects.id, projectId))
        .returning({ revision: projects.revision })
        .get()!.revision
}
