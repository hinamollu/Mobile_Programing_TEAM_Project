package com.mobileprograming.teamproject.feature.placement

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.util.AttributeSet
import android.view.MotionEvent
import android.view.View
import androidx.core.content.ContextCompat
import com.mobileprograming.teamproject.R
import kotlin.math.abs
import kotlin.math.min
import kotlin.math.roundToInt

/**
 * 2D 격자 배치 화면. 방을 격자로 그리고 가구를 끌어서 옮긴다(칸에 맞춰 스냅).
 * 상태가 바뀔 때마다(선택, 이동, 회전) onStateChanged가 불리고, 충돌 결과는 report에 있다.
 */
class PlacementView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    /** 충돌 판정기. PM의 엔진이 나오면 여기에 교체해서 꽂는다. */
    var checker: CollisionChecker = TemporaryCollisionChecker
        set(value) {
            field = value
            recheck()
        }

    var onStateChanged: (() -> Unit)? = null

    var selected: PlacedItem? = null
        private set

    var report: CollisionReport = CollisionReport.CLEAR
        private set

    private var room = GridRoom(40, 30)
    private val items = mutableListOf<PlacedItem>()

    private var cellPx = 0f
    private var originX = 0f
    private var originY = 0f

    private var dragging: PlacedItem? = null
    private var grabDx = 0f
    private var grabDy = 0f

    private val ink = ContextCompat.getColor(context, R.color.pm_ink)
    private val teal = ContextCompat.getColor(context, R.color.pm_teal)

    private val floorPaint = Paint().apply { color = Color.WHITE; style = Paint.Style.FILL }
    private val minorGridPaint = Paint().apply { color = Color.parseColor("#E6EAF0"); strokeWidth = dp(0.6f) }
    private val majorGridPaint = Paint().apply { color = Color.parseColor("#C3CBD6"); strokeWidth = dp(1.2f) }
    private val wallPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = ink; style = Paint.Style.STROKE; strokeWidth = dp(3f)
    }
    private val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL }
    private val strokePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.STROKE }
    private val overlapPaint = Paint().apply { color = Color.parseColor("#B3FFD60A"); style = Paint.Style.FILL }
    private val frontPaint = Paint().apply { color = Color.parseColor("#6623323B"); style = Paint.Style.FILL }
    private val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = ink; textAlign = Paint.Align.CENTER; isFakeBoldText = true
    }

    // ---- 공개 API ----

    fun setRoom(newRoom: GridRoom) {
        room = newRoom
        recomputeLayout()
        items.forEach { it.clampInto(room) }
        recheck()
    }

    fun setItems(newItems: List<PlacedItem>) {
        items.clear()
        items.addAll(newItems)
        items.forEach { it.clampInto(room) }
        selected = null
        dragging = null
        recheck()
    }

    fun itemsSnapshot(): List<PlacedItem> = items.toList()

    fun rotateSelected() {
        val item = selected ?: return
        item.rotateClockwise(room)
        recheck()
    }

    // ---- 상태 ----

    private fun recheck() {
        report = checker.check(room, items)
        invalidate()
        onStateChanged?.invoke()
    }

    private fun select(item: PlacedItem?) {
        if (selected === item) return
        selected = item
        if (item != null) {
            // 선택한 가구를 맨 위로 올린다
            items.remove(item)
            items.add(item)
        }
        invalidate()
        onStateChanged?.invoke()
    }

    // ---- 좌표 ----

    private fun dp(value: Float) = value * resources.displayMetrics.density

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        recomputeLayout()
    }

    private fun recomputeLayout() {
        val pad = dp(16f)
        val availW = width - 2 * pad
        val availH = height - 2 * pad
        if (availW <= 0f || availH <= 0f) {
            cellPx = 0f
            return
        }
        cellPx = min(availW / room.cols, availH / room.rows)
        originX = (width - cellPx * room.cols) / 2f
        originY = (height - cellPx * room.rows) / 2f
        invalidate()
    }

    private fun cellRect(col: Int, row: Int, cols: Int, rows: Int) = RectF(
        originX + col * cellPx,
        originY + row * cellPx,
        originX + (col + cols) * cellPx,
        originY + (row + rows) * cellPx
    )

    // ---- 그리기 ----

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        if (cellPx <= 0f) return
        val roomRect = cellRect(0, 0, room.cols, room.rows)
        canvas.drawRect(roomRect, floorPaint)
        drawGrid(canvas, roomRect)
        items.forEach { drawItem(canvas, it) }
        drawOverlaps(canvas)
        canvas.drawRect(roomRect, wallPaint)
    }

    private fun drawGrid(canvas: Canvas, rect: RectF) {
        val showMinor = cellPx >= dp(6f)
        for (c in 0..room.cols) {
            val x = originX + c * cellPx
            if (c % 10 == 0) canvas.drawLine(x, rect.top, x, rect.bottom, majorGridPaint)
            else if (showMinor) canvas.drawLine(x, rect.top, x, rect.bottom, minorGridPaint)
        }
        for (r in 0..room.rows) {
            val y = originY + r * cellPx
            if (r % 10 == 0) canvas.drawLine(rect.left, y, rect.right, y, majorGridPaint)
            else if (showMinor) canvas.drawLine(rect.left, y, rect.right, y, minorGridPaint)
        }
    }

    private fun drawItem(canvas: Canvas, item: PlacedItem) {
        val r = cellRect(item.col, item.row, item.cols, item.rows)
        fillPaint.color = PALETTE[abs(item.id.hashCode() % PALETTE.size)]
        canvas.drawRect(r, fillPaint)
        drawFrontStrip(canvas, item, r)

        if (item === selected) {
            val o = dp(2.5f)
            strokePaint.color = teal
            strokePaint.strokeWidth = dp(2f)
            canvas.drawRect(r.left - o, r.top - o, r.right + o, r.bottom + o, strokePaint)
        }

        val bad = report.involves(item.id)
        val w = if (bad) dp(2f) else dp(1.2f)
        strokePaint.color = if (bad) WARN_RED else ink
        strokePaint.strokeWidth = w
        canvas.drawRect(r.left + w / 2, r.top + w / 2, r.right - w / 2, r.bottom - w / 2, strokePaint)

        drawLabel(canvas, item, r)
    }

    /** 회전 방향을 알아볼 수 있게 가구의 앞면(0도일 때 아래쪽)에 띠를 그린다. */
    private fun drawFrontStrip(canvas: Canvas, item: PlacedItem, r: RectF) {
        val t = dp(4f)
        when ((item.rotation / 90) % 4) {
            0 -> canvas.drawRect(r.left, r.bottom - t, r.right, r.bottom, frontPaint)
            1 -> canvas.drawRect(r.left, r.top, r.left + t, r.bottom, frontPaint)
            2 -> canvas.drawRect(r.left, r.top, r.right, r.top + t, frontPaint)
            else -> canvas.drawRect(r.right - t, r.top, r.right, r.bottom, frontPaint)
        }
    }

    private fun drawLabel(canvas: Canvas, item: PlacedItem, r: RectF) {
        val maxW = r.width() - dp(6f)
        if (maxW <= dp(8f)) return
        var size = (cellPx * 1.8f).coerceIn(dp(9f), dp(14f))
        textPaint.textSize = size
        val w = textPaint.measureText(item.name)
        if (w > maxW) {
            size = (size * maxW / w).coerceAtLeast(dp(8f))
            textPaint.textSize = size
        }
        val fm = textPaint.fontMetrics
        val y = r.centerY() - (fm.ascent + fm.descent) / 2f
        canvas.save()
        canvas.clipRect(r)
        canvas.drawText(item.name, r.centerX(), y, textPaint)
        canvas.restore()
    }

    /** 겹치는 칸만 노랗게 표시한다. */
    private fun drawOverlaps(canvas: Canvas) {
        for ((idA, idB) in report.overlaps) {
            val a = items.firstOrNull { it.id == idA } ?: continue
            val b = items.firstOrNull { it.id == idB } ?: continue
            val area = a.intersection(b) ?: continue
            canvas.drawRect(
                cellRect(area.left, area.top, area.right - area.left, area.bottom - area.top),
                overlapPaint
            )
        }
    }

    // ---- 터치 ----

    override fun onTouchEvent(event: MotionEvent): Boolean {
        if (cellPx <= 0f) return false
        val gx = (event.x - originX) / cellPx
        val gy = (event.y - originY) / cellPx
        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                parent?.requestDisallowInterceptTouchEvent(true)
                val hit = items.lastOrNull {
                    gx >= it.col && gx < it.col + it.cols && gy >= it.row && gy < it.row + it.rows
                }
                select(hit)
                dragging = hit
                if (hit != null) {
                    grabDx = gx - hit.col
                    grabDy = gy - hit.row
                }
            }
            MotionEvent.ACTION_MOVE -> {
                val item = dragging ?: return true
                moveTo(item, (gx - grabDx).roundToInt(), (gy - grabDy).roundToInt())
            }
            MotionEvent.ACTION_UP -> {
                dragging = null
                parent?.requestDisallowInterceptTouchEvent(false)
                performClick()
            }
            MotionEvent.ACTION_CANCEL -> {
                dragging = null
                parent?.requestDisallowInterceptTouchEvent(false)
            }
        }
        return true
    }

    override fun performClick(): Boolean {
        super.performClick()
        return true
    }

    private fun moveTo(item: PlacedItem, col: Int, row: Int) {
        val oldCol = item.col
        val oldRow = item.row
        item.col = col
        item.row = row
        item.clampInto(room)
        if (item.col != oldCol || item.row != oldRow) recheck()
    }

    private companion object {
        val WARN_RED = Color.parseColor("#D93025")
        val PALETTE = intArrayOf(
            Color.parseColor("#BFE3DC"), Color.parseColor("#F7D6B5"),
            Color.parseColor("#CFD8F6"), Color.parseColor("#F4C9D6"),
            Color.parseColor("#DCE9B5"), Color.parseColor("#E5D0F0"),
            Color.parseColor("#FBE7A1"), Color.parseColor("#C9E4F2")
        )
    }
}
