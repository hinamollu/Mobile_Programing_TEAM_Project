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
            etFurnitureWidth.setText(current.width.toString())
            etFurnitureHeight.setText(current.depth.toString())
        }

        // 저장하기 버튼 클릭 시
        btnSaveFurniture.setOnClickListener {
            val name = etFurnitureName.text.toString().trim()
            val width = etFurnitureWidth.text.toString().toDoubleOrNull()
            val depth = etFurnitureHeight.text.toString().toDoubleOrNull()

            if (name.isEmpty() || width == null || depth == null || !width.isFinite() || !depth.isFinite() || width <= 0 || depth <= 0) {
                Toast.makeText(this, "이름과 0보다 큰 가로·세로 크기를 입력해주세요.", Toast.LENGTH_SHORT).show()
            } else {
                FurnitureCatalog.save(furnitureId, name, width, depth)
                finish()
            }
        }
    }

    companion object {
        const val EXTRA_FURNITURE_ID = "furniture_id"
    }
}