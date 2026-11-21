package com.mobileprograming.teamproject

import android.os.Bundle
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.example.ourroom.FurnitureFragment
import com.example.ourroom.RoomFragment
import com.mobileprograming.teamproject.databinding.ActivityMainBinding
import com.mobileprograming.teamproject.feature.placement.PlacementActivity
import com.mobileprograming.teamproject.feature.project.PmFurnitureUiModel
import com.mobileprograming.teamproject.feature.project.PmProjectNavigation
import com.mobileprograming.teamproject.feature.project.PmWorkspaceDestinations
import com.mobileprograming.teamproject.feature.project.PmWorkspaceFragment
import com.mobileprograming.teamproject.feature.project.PmWorkspaceTab

class MainActivity : AppCompatActivity(), PmWorkspaceDestinations, PmProjectNavigation {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        if (savedInstanceState == null) {
            supportFragmentManager.beginTransaction()
                .replace(R.id.fragment_container, PmWorkspaceFragment())
                .commit()
        }
        ViewCompat.setOnApplyWindowInsetsListener(binding.root) { view, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            insets
        }
    }

    override fun createPmTab(tab: PmWorkspaceTab) = when (tab) {
        PmWorkspaceTab.ROOM -> RoomFragment()
        PmWorkspaceTab.FURNITURE -> FurnitureFragment()
        PmWorkspaceTab.PROJECTS, PmWorkspaceTab.MY_PAGE -> null
    }

    /** 프로젝트 화면의 "배치하기" -> 2D 격자 배치 화면 */
    override fun onPmPlaceFurniture(projectId: String, planId: String, furniture: List<PmFurnitureUiModel>) {
        startActivity(PlacementActivity.createIntent(this, projectId, planId, furniture.map { it.id }))
    }

    /** 공유는 아직 연결된 화면이 없다. 이전과 같은 안내를 그대로 보여준다. */
    override fun onPmShareProject(projectId: String) {
        Toast.makeText(this, R.string.pm_unavailable, Toast.LENGTH_SHORT).show()
    }
}
