package com.mobileprograming.teamproject.feature.placement

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.ImageButton
import android.widget.TextView
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import com.example.ourroom.FurnitureCatalog
import com.example.ourroom.Mm
import com.example.ourroom.RoomCatalog
import com.example.ourroom.applyEditorInsets
import com.mobileprograming.teamproject.R

/**
 * 2D 격자 배치 화면. 프로젝트 화면의 "배치하기"에서 열린다 (MainActivity.onPmPlaceFurniture).
 * 지금은 임시 데이터 단계라서 방/가구는 RoomCatalog·FurnitureCatalog에서 읽고,
 * 배치 결과는 PlacementStore(메모리)에만 저장한다.
 */
class PlacementActivity : AppCompatActivity() {

    private lateinit var planKey: String
    private lateinit var placementView: PlacementView
    private lateinit var warningBanner: TextView
    private lateinit var infoTitle: TextView
    private lateinit var infoDetail: TextView
    private lateinit var rotateButton: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_placement)
        findViewById<View>(R.id.placementRoot).applyEditorInsets()

        val projectId = intent.getStringExtra(EXTRA_PROJECT_ID).orEmpty()
        val planId = intent.getStringExtra(EXTRA_PLAN_ID).orEmpty()
        planKey = "$projectId/$planId"
        val furnitureIds = intent.getStringArrayListExtra(EXTRA_FURNITURE_IDS).orEmpty()

        // 방: 프로젝트의 기본 방 id가 넘어오면 그 방, 아니면 첫 번째 방, 방이 하나도 없으면 4000mm x 3000mm 임시 방
        val room = RoomCatalog.find(intent.getIntExtra(EXTRA_ROOM_ID, NO_ROOM))
            ?: RoomCatalog.snapshot().firstOrNull()
        val roomName = room?.name ?: "임시 방"
        val roomWidthMm = (room?.width ?: 4000f).toDouble()
        val roomDepthMm = (room?.height ?: 3000f).toDouble()
        val gridRoom = GridRoom(GridUnits.roomCells(roomWidthMm), GridUnits.roomCells(roomDepthMm))

        findViewById<ImageButton>(R.id.placementBack).setOnClickListener { finish() }
        findViewById<TextView>(R.id.placementTitle).text = "$roomName 배치"
        findViewById<TextView>(R.id.placementSubtitle).text =
            "${Mm.format(roomWidthMm)}mm × ${Mm.format(roomDepthMm)}mm · 1칸 = ${GridUnits.CELL_MM}mm"
        warningBanner = findViewById(R.id.placementWarning)
        infoTitle = findViewById(R.id.placementInfoTitle)
        infoDetail = findViewById(R.id.placementInfoDetail)
        rotateButton = findViewById(R.id.placementRotate)
        placementView = findViewById(R.id.placementView)

        val items = furnitureIds.distinct().mapNotNull { FurnitureCatalog.find(it) }.map { f ->
            PlacedItem(
                id = f.id,
                name = f.name,
                baseCols = GridUnits.furnitureCells(f.width),
                baseRows = GridUnits.furnitureCells(f.depth),
                baseWidthMm = f.width,
                baseDepthMm = f.depth
            )
        }
        PlacementArranger.arrange(gridRoom, items, PlacementStore.load(planKey))

        rotateButton.setOnClickListener { placementView.rotateSelected() }
        placementView.setRoom(gridRoom)
        placementView.onStateChanged = {
            val current = placementView.itemsSnapshot()
            if (current.isNotEmpty()) PlacementStore.save(planKey, current)
            render()
        }
        placementView.setItems(items)
    }

    private fun render() {
        val report = placementView.report
        if (report.isClear) {
            warningBanner.visibility = View.GONE
        } else {
            warningBanner.text = warningText(report)
            warningBanner.visibility = View.VISIBLE
        }

        val item = placementView.selected
        rotateButton.isEnabled = item != null
        rotateButton.alpha = if (item != null) 1f else 0.4f
        if (item == null) {
            val hasItems = placementView.itemsSnapshot().isNotEmpty()
            infoTitle.text = if (hasItems) "가구를 눌러 선택하세요" else "배치할 가구가 없습니다"
            infoDetail.text = if (hasItems) {
                "끌어서 옮기고, 회전 버튼으로 90°씩 돌릴 수 있어요."
            } else {
                "프로젝트 화면의 배치안에서 가구를 먼저 선택해 주세요."
            }
        } else {
            infoTitle.text = item.name
            infoDetail.text = "크기 가로 ${Mm.format(item.widthMm)}mm × 세로 ${Mm.format(item.depthMm)}mm (${item.cols}×${item.rows}칸)\n" +
                "위치 ${GridUnits.cellsToMm(item.col)}mm, ${GridUnits.cellsToMm(item.row)}mm · 회전 ${item.rotation}°"
        }
    }

    private fun warningText(report: CollisionReport): String {
        val names = placementView.itemsSnapshot().associate { it.id to it.name }
        fun label(ids: Collection<String>): String {
            val list = ids.map { names[it] ?: it }
            return if (list.size <= 3) list.joinToString(", ")
            else list.take(3).joinToString(", ") + " 외 ${list.size - 3}개"
        }
        val lines = mutableListOf<String>()
        if (report.overlaps.isNotEmpty()) {
            lines += "⚠ 가구가 겹칩니다: " + label(report.overlaps.flatMap { listOf(it.first, it.second) }.distinct())
        }
        if (report.outOfBounds.isNotEmpty()) {
            lines += "⚠ 방 밖으로 나갔습니다: " + label(report.outOfBounds)
        }
        return lines.joinToString("\n")
    }

    companion object {
        const val NO_ROOM = -1
        private const val EXTRA_PROJECT_ID = "project_id"
        private const val EXTRA_PLAN_ID = "plan_id"
        private const val EXTRA_FURNITURE_IDS = "furniture_ids"
        private const val EXTRA_ROOM_ID = "room_id"

        fun createIntent(
            context: Context,
            projectId: String,
            planId: String,
            furnitureIds: List<String>,
            roomId: Int = NO_ROOM
        ): Intent = Intent(context, PlacementActivity::class.java)
            .putExtra(EXTRA_PROJECT_ID, projectId)
            .putExtra(EXTRA_PLAN_ID, planId)
            .putStringArrayListExtra(EXTRA_FURNITURE_IDS, ArrayList(furnitureIds))
            .putExtra(EXTRA_ROOM_ID, roomId)
    }
}
