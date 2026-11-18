package com.mobileprograming.teamproject

import android.os.Bundle
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.example.ourroom.FurnitureFragment
import com.example.ourroom.RoomFragment
import com.mobileprograming.teamproject.databinding.ActivityMainBinding
import com.mobileprograming.teamproject.feature.project.PmWorkspaceDestinations
import com.mobileprograming.teamproject.feature.project.PmWorkspaceFragment
import com.mobileprograming.teamproject.feature.project.PmWorkspaceTab

class MainActivity : AppCompatActivity(), PmWorkspaceDestinations {
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
}
