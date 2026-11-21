package com.mobileprograming.teamproject.feature.placement

import kotlin.math.ceil
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min

/**
 * 배치 화면이 쓰는 순수 Kotlin 모델. Android 의존성이 없어서 단위 테스트가 쉽다.
 *
 * 임시 구현이라 아래 세 가지는 팀원 작업이 끝나면 이 파일에서 교체한다.
 *  - GridUnits                      : 강준하(PM)의 "실제 치수 <-> 격자 좌표 변환"
 *  - CollisionChecker 구현체         : 강준하(PM)의 충돌 엔진 (TemporaryCollisionChecker 자리)
 *  - PlacementStore                 : 이민형(BE)의 "가구 좌표·회전 저장/불러오기"
 */

/** 실제 치수(mm)를 격자 칸으로 바꾸는 규칙. 1칸 = 100mm(10cm). */
object GridUnits {
    const val CELL_MM = 100
    private const val EPS = 1e-6
    private const val MAX_CELLS = 500

    /** 가구: 실제 크기를 모두 덮는 최소 칸 수(올림). 최소 1칸. */
    fun furnitureCells(mm: Double): Int = cells(ceil(mm / CELL_MM - EPS))

    /** 방: 온전히 들어가는 칸 수(내림). 최소 1칸. */
    fun roomCells(mm: Double): Int = cells(floor(mm / CELL_MM + EPS))

    fun cellsToMm(cells: Int): Int = cells * CELL_MM

    private fun cells(value: Double): Int =
        if (value.isNaN()) 1 else value.coerceIn(1.0, MAX_CELLS.toDouble()).toInt()
}

data class GridRoom(val cols: Int, val rows: Int)

/** 칸 단위 사각형. right/bottom은 포함하지 않는다. */
data class CellRect(val left: Int, val top: Int, val right: Int, val bottom: Int)

/**
 * 방 안에 놓인 가구 하나.
 * rotation은 시계 방향 0/90/180/270도이고, 90/270일 때 가로·세로 칸이 서로 바뀐다.
 */
class PlacedItem(
    val id: String,
    val name: String,
    val baseCols: Int,
    val baseRows: Int,
    val baseWidthMm: Double,
    val baseDepthMm: Double,
    var col: Int = 0,
    var row: Int = 0,
    var rotation: Int = 0
) {
    private val turned: Boolean get() = rotation % 180 != 0

    /** 현재 방향에서 차지하는 칸 수 */
    val cols: Int get() = if (turned) baseRows else baseCols
    val rows: Int get() = if (turned) baseCols else baseRows

    /** 현재 방향 기준 실제 크기(mm) */
    val widthMm: Double get() = if (turned) baseDepthMm else baseWidthMm
    val depthMm: Double get() = if (turned) baseWidthMm else baseDepthMm

    fun intersection(other: PlacedItem): CellRect? {
        val l = max(col, other.col)
        val t = max(row, other.row)
        val r = min(col + cols, other.col + other.cols)
        val b = min(row + rows, other.row + other.rows)
        return if (l < r && t < b) CellRect(l, t, r, b) else null
    }

    fun overlaps(other: PlacedItem): Boolean = intersection(other) != null

    /** 방 안에 다 들어오도록 위치를 밀어 넣는다. 방보다 큰 가구는 (0,0)에 두고 경고 대상으로 남긴다. */
    fun clampInto(room: GridRoom) {
        col = col.coerceIn(0, (room.cols - cols).coerceAtLeast(0))
        row = row.coerceIn(0, (room.rows - rows).coerceAtLeast(0))
    }

    /** 중심을 유지한 채 시계 방향으로 90도 회전. */
    fun rotateClockwise(room: GridRoom) {
        val centerX2 = 2 * col + cols
        val centerY2 = 2 * row + rows
        rotation = (rotation + 90) % 360
        col = Math.floorDiv(centerX2 - cols, 2)
        row = Math.floorDiv(centerY2 - rows, 2)
        clampInto(room)
    }
}

data class CollisionReport(
    /** 서로 겹치는 가구 id 쌍 */
    val overlaps: List<Pair<String, String>>,
    /** 방 밖으로 나간 가구 id */
    val outOfBounds: Set<String>
) {
    val isClear: Boolean get() = overlaps.isEmpty() && outOfBounds.isEmpty()

    fun involves(id: String): Boolean =
        id in outOfBounds || overlaps.any { it.first == id || it.second == id }

    companion object {
        val CLEAR = CollisionReport(emptyList(), emptySet())
    }
}

/** 충돌 판정 자리. PM의 충돌 엔진이 나오면 이 인터페이스를 구현해서 PlacementView.checker에 꽂는다. */
fun interface CollisionChecker {
    fun check(room: GridRoom, items: List<PlacedItem>): CollisionReport
}

/** 임시 판정: 가구끼리 겹침 + 방 경계 밖. 문 개폐 범위, 창문 등은 아직 보지 않는다. */
object TemporaryCollisionChecker : CollisionChecker {
    override fun check(room: GridRoom, items: List<PlacedItem>): CollisionReport {
        val overlaps = mutableListOf<Pair<String, String>>()
        val outOfBounds = linkedSetOf<String>()
        for (i in items.indices) {
            val a = items[i]
            if (a.col < 0 || a.row < 0 || a.col + a.cols > room.cols || a.row + a.rows > room.rows) {
                outOfBounds += a.id
            }
            for (j in i + 1 until items.size) {
                val b = items[j]
                if (a.overlaps(b)) overlaps += a.id to b.id
            }
        }
        return CollisionReport(overlaps, outOfBounds)
    }
}

data class Pose(val col: Int, val row: Int, val rotation: Int)

/** 앱이 켜져 있는 동안만 배치를 기억한다. BE의 저장소가 나오면 교체. 키는 "프로젝트/배치안". */
object PlacementStore {
    private val saved = HashMap<String, Map<String, Pose>>()

    fun load(planKey: String): Map<String, Pose> = saved[planKey].orEmpty()

    fun save(planKey: String, items: List<PlacedItem>) {
        saved[planKey] = items.associate { it.id to Pose(it.col, it.row, it.rotation) }
    }
}

object PlacementArranger {
    /** 저장된 자세가 있으면 복원하고, 없는 가구는 겹치지 않는 첫 빈자리(왼쪽 위부터)에 놓는다. */
    fun arrange(room: GridRoom, items: List<PlacedItem>, saved: Map<String, Pose>) {
        val placed = ArrayList<PlacedItem>()
        val fresh = ArrayList<PlacedItem>()
        for (item in items) {
            val pose = saved[item.id]
            if (pose == null) {
                fresh += item
                continue
            }
            item.rotation = pose.rotation
            item.col = pose.col
            item.row = pose.row
            item.clampInto(room)
            placed += item
        }
        for (item in fresh) {
            placeInFirstFreeSpot(room, item, placed)
            placed += item
        }
    }

    private fun placeInFirstFreeSpot(room: GridRoom, item: PlacedItem, others: List<PlacedItem>) {
        for (r in 0..(room.rows - item.rows)) {
            for (c in 0..(room.cols - item.cols)) {
                item.col = c
                item.row = r
                if (others.none { item.overlaps(it) }) return
            }
        }
        item.col = 0
        item.row = 0
    }
}
