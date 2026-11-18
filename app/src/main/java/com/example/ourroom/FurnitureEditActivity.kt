package com.example.ourroom

import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class FurnitureEditActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_furniture_edit)

        val etFurnitureName = findViewById<EditText>(R.id.etFurnitureName)
        val etFurnitureWidth = findViewById<EditText>(R.id.etFurnitureWidth)
        val etFurnitureHeight = findViewById<EditText>(R.id.etFurnitureHeight)
        val btnSaveFurniture = findViewById<Button>(R.id.btnSaveFurniture)

        // 저장하기 버튼 클릭 시
        btnSaveFurniture.setOnClickListener {
            val name = etFurnitureName.text.toString()
            val width = etFurnitureWidth.text.toString()
            val height = etFurnitureHeight.text.toString()

            if (name.isEmpty() || width.isEmpty() || height.isEmpty()) {
                Toast.makeText(this, "모든 칸을 입력해주세요!", Toast.LENGTH_SHORT).show()
            } else {
                // 나중에 DB에 저장하는 코드가 들어갈 자리!
                Toast.makeText(this, "가구 '$name'이(가) 추가되었습니다!", Toast.LENGTH_SHORT).show()
                finish() // 화면 닫고 이전 화면(가구 탭)으로 복귀
            }
        }
    }
}