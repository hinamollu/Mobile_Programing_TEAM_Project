import { asc, eq, inArray } from 'drizzle-orm'

import { type DbOrTx, layouts, placements } from '@/db'
import { newId } from '@/lib/id'

export type Layout = typeof layouts.$inferSelect

export function withPlacements(db: DbOrTx, list: Layout[]) {
    if (list.length === 0) return []
    const rows = db
        .select()
        .from(placements)
        .where(
            inArray(
                placements.layoutId,
                list.map((layout) => layout.id),
            ),
        )
        .orderBy(asc(placements.createdAt))
        .all()
    return list.map((layout) => ({
        ...layout,
        placements: rows.filter((placement) => placement.layoutId === layout.id),
    }))
}

export function copyLayout(
    tx: DbOrTx,
    layout: Layout,
    values: { projectId: string; name: string; createdAt?: number },
) {
    const copy = tx
        .insert(layouts)
        .values({ ...layout, id: newId(), createdAt: undefined, updatedAt: undefined, ...values })
        .returning()
        .get()
    const rows = tx.select().from(placements).where(eq(placements.layoutId, layout.id)).all()
    if (rows.length > 0) {
        tx.insert(placements)
            .values(rows.map((placement) => ({ ...placement, id: newId(), layoutId: copy.id })))
            .run()
    }
    return withPlacements(tx, [copy])[0]!
}
