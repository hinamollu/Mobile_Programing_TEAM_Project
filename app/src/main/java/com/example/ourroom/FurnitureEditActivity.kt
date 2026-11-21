package com.example.ourroom

import com.mobileprograming.teamproject.R
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity

class FurnitureEditActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_furniture_edit)
        findViewById<android.view.View>(R.id.furnitureEditForm).applyEditorInsets()
        val furnitureId = intent.getStringExtra(EXTRA_FURNITURE_ID)
        val current = furnitureId?.let(FurnitureCatalog::find)
        if (furnitureId != null && current == null) {
            finish()
            return
        }

        val etFurnitureName = findViewById<EditText>(R.id.etFurnitureName)
        val etFurnitureWidth = findViewById<EditText>(R.id.etFurnitureWidth)
        val etFurnitureHeight = findViewById<EditText>(R.id.etFurnitureHeight)
        val btnSaveFurniture = findViewById<Button>(R.id.btnSaveFurniture)

        if (current != null && savedInstanceState == null) {
            etFurnitureName.setText(current.name)
            etFurnitureWidth.setText(Mm.format(current.width))
            etFurnitureHeight.setText(Mm.format(current.depth))
        }

        // 저장하기 버튼 클릭 시
        btnSaveFurniture.setOnClickListener {
            val name = etFurnitureName.text.toString().trim()
            val width = Mm.parse(etFurnitureWidth.text.toString())
            val depth = Mm.parse(etFurnitureHeight.text.toString())

            if (name.isEmpty() || width == null || depth == null) {
                Toast.makeText(this, "이름과 가로·세로 크기(1~100000mm 정수)를 입력해주세요.", Toast.LENGTH_SHORT).show()
            } else {
                FurnitureCatalog.save(furnitureId, name, width.toDouble(), depth.toDouble())
                finish()
            }
        }
    }

    companion object {
        const val EXTRA_FURNITURE_ID = "furniture_id"
    }
}