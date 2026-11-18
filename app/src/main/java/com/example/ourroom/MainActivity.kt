package com.example.ourroom // 본인 패키지명

import android.os.Bundle
import android.widget.Toast // Toast 오류를 해결해주는 코드!
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import com.google.android.material.bottomnavigation.BottomNavigationView

class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // ==========================================
        // 1. 하단 바텀 네비게이션 뷰 연결 및 초기 화면 설정
        // ==========================================
        val bottomNav = findViewById<BottomNavigationView>(R.id.bottom_navigation)

        // 앱을 처음 켰을 때 '방 목록(RoomFragment)' 화면을 기본으로 띄움
        supportFragmentManager.beginTransaction()
            .replace(R.id.fragment_container, RoomFragment())
            .commit()

        // ==========================================
        // 2. 하단 탭을 눌렀을 때 화면(프래그먼트) 전환하는 코드
        // ==========================================
        bottomNav.setOnItemSelectedListener { item ->
            var selectedFragment: Fragment? = null

            when (item.itemId) {
                R.id.tab_room -> selectedFragment = RoomFragment()
                // 나중에 다른 화면(가구, 배치 등)을 만들면 아래에 추가하면 됩니다.
                // R.id.tab_furniture -> selectedFragment = FurnitureFragment()
                // R.id.tab_layout -> selectedFragment = LayoutFragment()
            }

            // 선택된 화면으로 교체하기
            if (selectedFragment != null) {
                supportFragmentManager.beginTransaction()
                    .replace(R.id.fragment_container, selectedFragment)
                    .commit()
            }
            true
        }
        bottomNav.setOnItemSelectedListener { item ->
            var selectedFragment: Fragment? = null

            when (item.itemId) {
                R.id.tab_room -> selectedFragment = RoomFragment()
                R.id.tab_furniture -> selectedFragment = FurnitureFragment() // ★ 이 줄이 꼭 있어야 합니다!
                // R.id.tab_layout -> selectedFragment = LayoutFragment()
                // R.id.tab_my -> selectedFragment = MyPageFragment()
            }

            if (selectedFragment != null) {
                supportFragmentManager.beginTransaction()
                    .replace(R.id.fragment_container, selectedFragment)
                    .commit()
            }
            true
        }
        // ==========================================
        // 3. SharedPreferences를 이용한 데이터 저장 및 팝업 띄우기
        // ==========================================
        // 메모장 열기
        val sharedPref = getSharedPreferences("AppPrefs", MODE_PRIVATE)

        // "내 침실"이라고 메모장에 저장하기
        val editor = sharedPref.edit()
        editor.putString("LAST_EDITED_ROOM", "내 침실")
        editor.apply()

        // 메모장에서 읽어와서 Toast 팝업으로 띄워주기
        val lastRoom = sharedPref.getString("LAST_EDITED_ROOM", "없음")
        Toast.makeText(this, "마지막 작업 방: $lastRoom", Toast.LENGTH_LONG).show()
    }
}