package com.mobileprograming.teamproject.feature.project

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.CheckBox
import android.widget.EditText
import android.widget.ImageButton
import android.widget.TextView
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.widget.PopupMenu
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.mobileprograming.teamproject.R

/** Entry point. Internal routes remain local; no shared graph or Activity edits required. */
class PmProjectFragment : Fragment(R.layout.pm_fragment_projects) {
    private val state: PmProjectState by viewModels()
    private var rows: RecyclerView? = null
    private val dialogs = mutableListOf<AlertDialog>()
    private lateinit var backHandler: OnBackPressedCallback

    private data class Row(
        val name: String,
        val info: String = "",
        val primary: String? = null,
        val secondary: String? = null,
        val tertiary: String? = null,
        val onPrimary: () -> Unit = {},
        val onSecondary: () -> Unit = {},
        val onTertiary: (View) -> Unit = {},
        val onDelete: (() -> Unit)? = null,
        val kind: String? = null
    )

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        rows = view.findViewById<RecyclerView>(R.id.pm_list).apply {
            layoutManager = LinearLayoutManager(requireContext())
        }
        backHandler = object : OnBackPressedCallback(false) {
            override fun handleOnBackPressed() { state.back(); render() }
        }
        requireActivity().onBackPressedDispatcher.addCallback(viewLifecycleOwner, backHandler)
        view.findViewById<View>(R.id.pm_back).setOnClickListener { state.back(); render() }
        view.findViewById<View>(R.id.pm_share).setOnClickListener {
            state.project()?.let { project -> external { onPmShareProject(project.id) } }
        }
        render()
    }

    private fun navigation(): PmProjectNavigation? {
        var ancestor = parentFragment
        while (ancestor != null) {
            if (ancestor is PmProjectNavigation) return ancestor
            ancestor = ancestor.parentFragment
        }
        return activity as? PmProjectNavigation
    }

    private fun external(action: PmProjectNavigation.() -> Unit) {
        val target = navigation()
        if (target == null) Toast.makeText(requireContext(), R.string.pm_unavailable, Toast.LENGTH_SHORT).show()
        else target.action()
    }

    private fun render() {
        val root = view ?: return
        val project = state.project()
        val plan = state.plan()
        backHandler.isEnabled = project != null
        root.findViewById<View>(R.id.pm_back).visibility = if (project == null) View.GONE else View.VISIBLE
        root.findViewById<View>(R.id.pm_share).visibility = if (project != null && plan == null) View.VISIBLE else View.GONE
        // Activity owns its toolbar. This title is local to the feature's view.
        root.findViewById<TextView>(R.id.pm_title).text = when {
            plan != null -> getString(R.string.pm_furniture_title, plan.name)
            project != null -> getString(R.string.pm_project_title, project.name)
            else -> getString(R.string.pm_list_title)
        }
        val content = mutableListOf<Row>()
        val add = root.findViewById<View>(R.id.pm_add)
        when {
            plan != null -> {
                content += Row(getString(R.string.pm_selected_count, plan.furnitureIds.size))
                content += state.furniture(plan).map { furniture ->
                    Row(furniture.name, furniture.category, getString(R.string.pm_remove), onPrimary = {
                        state.setFurniture(plan.furnitureIds.filterNot { it == furniture.id }); render()
                    })
                }
                add.contentDescription = getString(R.string.pm_furniture_add)
                add.setOnClickListener { selectFurniture() }
            }
            project != null -> {
                content += project.plans.map { layout ->
                    Row(layout.name, primary = getString(R.string.pm_furniture_count, layout.furnitureIds.size),
                        secondary = getString(R.string.pm_place), tertiary = getString(R.string.pm_duplicate),
                        onPrimary = { state.planId = layout.id; render() },
                        onSecondary = { external { onPmPlaceFurniture(project.id, layout.id, state.furniture(layout)) } },
                        onTertiary = { state.duplicatePlan(layout.id); render() },
                        onDelete = { confirm { state.deletePlan(layout.id); render() } })
                }
                add.contentDescription = getString(R.string.pm_plan_add)
                add.setOnClickListener {
                    nameDialog(R.string.pm_plan_create) { name, _ -> state.createPlan(name); render() }
                }
            }
            else -> {
                listOf(false, true).forEach { shared ->
                    content += Row(getString(if (shared) R.string.pm_shared else R.string.pm_personal))
                    val projects = state.projects.filter { it.shared == shared }
                    if (projects.isEmpty()) content += Row(getString(R.string.pm_empty))
                    content += projects.map { item ->
                        Row(item.name, getString(R.string.pm_plan_count, item.plans.size),
                            getString(R.string.pm_open_project), tertiary = getString(R.string.pm_manage),
                            kind = getString(if (item.shared) R.string.pm_shared else R.string.pm_personal),
                            onPrimary = { state.projectId = item.id; state.planId = null; render() },
                            onTertiary = { anchor ->
                                PopupMenu(requireContext(), anchor).apply {
                                    menu.add(R.string.pm_open_project).setOnMenuItemClickListener {
                                        state.projectId = item.id; state.planId = null; render(); true
                                    }
                                    menu.add(R.string.pm_project_edit).setOnMenuItemClickListener {
                                        nameDialog(R.string.pm_project_edit, item) { name, checked ->
                                            state.saveProject(item.id, name, checked); render()
                                        }; true
                                    }
                                    menu.add(R.string.pm_delete).setOnMenuItemClickListener {
                                        confirm { state.deleteProject(item.id); render() }; true
                                    }
                                }.show()
                            })
                    }
                }
                add.contentDescription = getString(R.string.pm_project_add)
                add.setOnClickListener {
                    nameDialog(R.string.pm_project_create, projectInput = true) { name, shared ->
                        state.saveProject(null, name, shared); render()
                    }
                }
            }
        }
        if (content.isEmpty()) content += Row(getString(R.string.pm_empty))
        rows?.adapter = Cards(content)
    }

    private fun track(dialog: AlertDialog) {
        dialogs += dialog
        dialog.setOnDismissListener { dialogs.remove(dialog) }
        dialog.show()
        val teal = androidx.core.content.ContextCompat.getColor(requireContext(), R.color.pm_teal)
        dialog.getButton(AlertDialog.BUTTON_POSITIVE)?.setTextColor(teal)
        dialog.getButton(AlertDialog.BUTTON_NEGATIVE)?.setTextColor(teal)
    }

    private fun confirm(action: () -> Unit) {
        track(AlertDialog.Builder(requireContext()).setTitle(R.string.pm_delete_title)
            .setMessage(R.string.pm_delete_message).setNegativeButton(R.string.pm_cancel, null)
            .setPositiveButton(R.string.pm_delete) { _, _ -> action() }.create())
    }

    private fun nameDialog(
        title: Int, project: PmProjectUiModel? = null, projectInput: Boolean = project != null,
        save: (String, Boolean) -> Unit
    ) {
        val form = layoutInflater.inflate(R.layout.pm_dialog_name, null)
        val input = form.findViewById<EditText>(R.id.pm_input)
        val shared = form.findViewById<CheckBox>(R.id.pm_shared)
        input.setText(project?.name.orEmpty())
        shared.visibility = if (projectInput) View.VISIBLE else View.GONE
        shared.isChecked = project?.shared ?: false
        val dialog = AlertDialog.Builder(requireContext()).setTitle(title).setView(form)
            .setNegativeButton(R.string.pm_cancel, null).setPositiveButton(R.string.pm_save, null).create()
        track(dialog)
        dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener {
            val name = input.text.toString().trim()
            if (name.isBlank()) input.error = getString(R.string.pm_name_error)
            else { save(name, shared.isChecked); dialog.dismiss() }
        }
    }

    private fun selectFurniture() {
        val plan = state.plan() ?: return
        val available = state.catalog.filterNot { it.id in plan.furnitureIds }
        if (available.isEmpty()) {
            Toast.makeText(requireContext(), R.string.pm_catalog_empty, Toast.LENGTH_SHORT).show(); return
        }
        val checked = BooleanArray(available.size)
        track(AlertDialog.Builder(requireContext()).setTitle(R.string.pm_catalog)
            .setMultiChoiceItems(available.map { "${it.name} · ${it.category}" }.toTypedArray(), checked) { _, index, value ->
                checked[index] = value
            }.setNegativeButton(R.string.pm_cancel, null)
            .setPositiveButton(R.string.pm_save) { _, _ ->
                state.setFurniture(plan.furnitureIds + available.filterIndexed { index, _ -> checked[index] }.map { it.id })
                render()
            }.create())
    }

    private inner class Cards(private val items: List<Row>) : RecyclerView.Adapter<Cards.Holder>() {
        inner class Holder(val root: View) : RecyclerView.ViewHolder(root)
        override fun getItemViewType(position: Int): Int {
            val row = items[position]
            return when {
                row.secondary != null -> R.layout.pm_item_card
                row.tertiary != null -> R.layout.pm_item_project
                row.primary != null -> R.layout.pm_item_furniture
                else -> R.layout.pm_item_section
            }
        }
        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) = Holder(
            LayoutInflater.from(parent.context).inflate(viewType, parent, false))
        override fun getItemCount() = items.size
        override fun onBindViewHolder(holder: Holder, position: Int) {
            val row = items[position]
            val root = holder.root
            root.findViewById<TextView>(R.id.pm_name).text = row.name
            root.findViewById<TextView>(R.id.pm_info)?.text = row.info
            root.findViewById<TextView>(R.id.pm_kind)?.text = row.kind
            fun button(id: Int, label: String?, action: (View) -> Unit) {
                val control = root.findViewById<View>(id) ?: return
                if (control is Button) control.text = label
                control.contentDescription = label
                control.visibility = if (label == null) View.GONE else View.VISIBLE
                control.setOnClickListener(action)
            }
            button(R.id.pm_primary, row.primary) { row.onPrimary() }
            button(R.id.pm_secondary, row.secondary) { row.onSecondary() }
            button(R.id.pm_tertiary, row.tertiary, row.onTertiary)
            if (getItemViewType(position) == R.layout.pm_item_project) {
                root.setOnClickListener { row.onPrimary() }
                root.isFocusable = true
            }
            root.findViewById<ImageButton>(R.id.pm_delete)?.apply {
                contentDescription = getString(R.string.pm_delete_named, row.name)
                setOnClickListener { row.onDelete?.invoke() }
            }
        }
    }

    override fun onDestroyView() {
        dialogs.toList().forEach { it.dismiss() }
        rows?.adapter = null
        rows = null
        super.onDestroyView()
    }
}
