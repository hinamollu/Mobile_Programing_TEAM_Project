package com.example.ourroom

import android.os.Bundle
import android.widget.Button
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class RoomEditActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // 2단계에서 만들 레이아웃(디자인) 파일을 화면에 띄움
        setContentView(R.layout.activity_room_edit)

        val btnSave = findViewById<Button>(R.id.btnSave)
        btnSave.setOnClickListener {
            // 저장 버튼을 누르면 팝업만 띄우고 이전 화면으로 돌아가기(finish)
            Toast.makeText(this, "방 정보가 임시 저장되었습니다.", Toast.LENGTH_SHORT).show()
            finish()
        }
    }
}