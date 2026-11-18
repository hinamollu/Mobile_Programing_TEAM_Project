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
            width.setText(current.width.toString())
            length.setText(current.height.toString())
            doors.setText(current.doorCount.toString())
            windows.setText(current.windowCount.toString())
        }

        findViewById<Button>(R.id.btnSave).setOnClickListener {
            val roomName = name.text.toString().trim()
            val roomWidth = width.text.toString().toFloatOrNull()
            val roomLength = length.text.toString().toFloatOrNull()
            val doorCount = doors.text.toString().ifBlank { "0" }.toIntOrNull()
            val windowCount = windows.text.toString().ifBlank { "0" }.toIntOrNull()
            when {
                roomName.isEmpty() -> name.error = "방 이름을 입력해 주세요."
                roomWidth == null || !roomWidth.isFinite() || roomWidth <= 0 -> width.error = "0보다 큰 가로 길이를 입력해 주세요."
                roomLength == null || !roomLength.isFinite() || roomLength <= 0 -> length.error = "0보다 큰 세로 길이를 입력해 주세요."
                doorCount == null || doorCount < 0 -> doors.error = "문 개수를 확인해 주세요."
                windowCount == null || windowCount < 0 -> windows.error = "창문 개수를 확인해 주세요."
                else -> {
                    RoomCatalog.save(RoomEntity(roomId, roomName, roomWidth, roomLength, doorCount, windowCount))
                    finish()
                }
            }
        }
    }

    companion object {
        const val EXTRA_ROOM_ID = "room_id"
    }
}
