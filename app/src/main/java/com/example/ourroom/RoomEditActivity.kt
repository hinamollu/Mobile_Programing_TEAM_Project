package com.example.ourroom

import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import com.mobileprograming.teamproject.R

class RoomEditActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_room_edit)
        findViewById<android.view.View>(R.id.roomEditForm).applyEditorInsets()

        val roomId = intent.getIntExtra(EXTRA_ROOM_ID, 0)
        val current = RoomCatalog.find(roomId)
        if (roomId != 0 && current == null) {
            finish()
            return
        }

        val name = findViewById<EditText>(R.id.etRoomName)
        val width = findViewById<EditText>(R.id.etWidth)
        val length = findViewById<EditText>(R.id.etHeight)
        val doors = findViewById<EditText>(R.id.etDoor)
        val windows = findViewById<EditText>(R.id.etWindow)
        if (current != null && savedInstanceState == null) {
            name.setText(current.name)
            width.setText(Mm.format(current.width))
            length.setText(Mm.format(current.height))
            doors.setText(current.doorCount.toString())
            windows.setText(current.windowCount.toString())
        }

        findViewById<Button>(R.id.btnSave).setOnClickListener {
            val roomName = name.text.toString().trim()
            val roomWidth = Mm.parse(width.text.toString())
            val roomLength = Mm.parse(length.text.toString())
            val doorCount = doors.text.toString().ifBlank { "0" }.toIntOrNull()
            val windowCount = windows.text.toString().ifBlank { "0" }.toIntOrNull()
            when {
                roomName.isEmpty() -> name.error = "방 이름을 입력해 주세요."
                roomWidth == null -> width.error = "가로 길이를 1~100000mm 정수로 입력해 주세요."
                roomLength == null -> length.error = "세로 길이를 1~100000mm 정수로 입력해 주세요."
                doorCount == null || doorCount < 0 -> doors.error = "문 개수를 확인해 주세요."
                windowCount == null || windowCount < 0 -> windows.error = "창문 개수를 확인해 주세요."
                else -> {
                    RoomCatalog.save(RoomEntity(roomId, roomName, roomWidth.toFloat(), roomLength.toFloat(), doorCount, windowCount))
                    finish()
                }
            }
        }
    }

    companion object {
        const val EXTRA_ROOM_ID = "room_id"
    }
}
