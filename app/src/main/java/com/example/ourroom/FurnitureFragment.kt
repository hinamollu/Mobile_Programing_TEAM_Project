package com.example.ourroom

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.floatingactionbutton.FloatingActionButton

class FurnitureFragment : Fragment() {

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_furniture, container, false)

        // 1. 임시 가구 데이터 (나중에 DB나 모델과 연동할 부분)
        val dummyFurniture = listOf("2인용 소파", "원목 책상", "퀸사이즈 침대")

        // 2. 리사이클러뷰 설정 (일단 뷰가 정상적으로 붙는지 확인용)
        val recyclerView = view.findViewById<RecyclerView>(R.id.recyclerViewFurniture)
        recyclerView.layoutManager = LinearLayoutManager(requireContext())

        // 3. 우측 하단 [+] 버튼 클릭 시 가구 추가 화면으로 이동 (아직 액티비티를 안 만들었으니 토스트만!)
        val fabAddFurniture = view.findViewById<FloatingActionButton>(R.id.fabAddFurniture)
        fabAddFurniture.setOnClickListener {
            Toast.makeText(requireContext(), "가구 추가 버튼 클릭됨!", Toast.LENGTH_SHORT).show()

            // 나중에 가구 추가 화면이 완성되면 이 주석을 풀면 됩니다.
            // val intent = Intent(requireContext(), FurnitureEditActivity::class.java)
            // startActivity(intent)
        }

        return view
    }
}