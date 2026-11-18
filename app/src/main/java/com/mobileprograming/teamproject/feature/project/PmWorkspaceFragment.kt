package com.mobileprograming.teamproject.feature.project

import android.os.Bundle
import android.view.View
import android.widget.TextView
import androidx.activity.OnBackPressedCallback
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.lifecycle.Lifecycle
import com.mobileprograming.teamproject.R

enum class PmWorkspaceTab { ROOM, FURNITURE, PROJECTS, MY_PAGE }

/** Optional integration seam. Return teammates' Fragment for a tab, or null for a placeholder. */
interface PmWorkspaceDestinations {
    fun createPmTab(tab: PmWorkspaceTab): Fragment?
}

/** Optional bottom-bar shell. The project feature can still be embedded on its own. */
class PmWorkspaceFragment : Fragment(R.layout.pm_fragment_workspace) {
    private var selected = PmWorkspaceTab.PROJECTS
    private lateinit var backHandler: OnBackPressedCallback
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        selected = savedInstanceState?.getString("pm_selected_tab")?.let { name ->
            PmWorkspaceTab.entries.find { it.name == name }
        } ?: PmWorkspaceTab.PROJECTS
    }
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        backHandler = object : OnBackPressedCallback(selected != PmWorkspaceTab.PROJECTS) {
            override fun handleOnBackPressed() { select(PmWorkspaceTab.PROJECTS) }
        }
        requireActivity().onBackPressedDispatcher.addCallback(viewLifecycleOwner, backHandler)
        tabs().forEach { (tab, id) -> view.findViewById<View>(id).setOnClickListener { select(tab) } }
        select(selected)
    }
    private fun tabs() = listOf(
        PmWorkspaceTab.ROOM to R.id.pm_tab_room,
        PmWorkspaceTab.FURNITURE to R.id.pm_tab_furniture,
        PmWorkspaceTab.PROJECTS to R.id.pm_tab_projects,
        PmWorkspaceTab.MY_PAGE to R.id.pm_tab_mypage)

    private fun provider(): PmWorkspaceDestinations? {
        var ancestor = parentFragment
        while (ancestor != null) {
            if (ancestor is PmWorkspaceDestinations) return ancestor
            ancestor = ancestor.parentFragment
        }
        return activity as? PmWorkspaceDestinations
    }
    private fun select(tab: PmWorkspaceTab) {
        if (childFragmentManager.isStateSaved) return
        selected = tab
        backHandler.isEnabled = tab != PmWorkspaceTab.PROJECTS
        val transaction = childFragmentManager.beginTransaction().setReorderingAllowed(true)
        tabs().forEach { (destination, id) ->
            val tag = "pm_tab_${destination.name}"
            val existing = childFragmentManager.findFragmentByTag(tag)
            if (destination == tab) {
                val fragment = existing ?: if (tab == PmWorkspaceTab.PROJECTS) PmProjectFragment()
                    else provider()?.createPmTab(tab) ?: PmTeammatePlaceholderFragment()
                if (existing == null) transaction.add(R.id.pm_tab_content, fragment, tag)
                transaction.show(fragment).setMaxLifecycle(fragment, Lifecycle.State.RESUMED)
            } else if (existing != null) {
                // CREATED makes hidden project back handlers inactive, retaining its ViewModel.
                transaction.hide(existing).setMaxLifecycle(existing, Lifecycle.State.CREATED)
            }
            view?.findViewById<TextView>(id)?.apply {
                isSelected = destination == tab
                val color = ContextCompat.getColor(context, if (isSelected) R.color.pm_teal else R.color.pm_ink)
                setTextColor(color)
                compoundDrawables.filterNotNull().forEach { it.mutate().setTint(color) }
            }
        }
        transaction.commitNow()
    }
    override fun onSaveInstanceState(outState: Bundle) {
        outState.putString("pm_selected_tab", selected.name)
        super.onSaveInstanceState(outState)
    }
}

class PmTeammatePlaceholderFragment : Fragment(R.layout.pm_fragment_placeholder)
