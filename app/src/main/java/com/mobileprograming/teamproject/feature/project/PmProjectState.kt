package com.mobileprograming.teamproject.feature.project

import androidx.lifecycle.ViewModel
import com.example.ourroom.FurnitureCatalog
import java.util.UUID

data class PmFurnitureUiModel(val id: String, val name: String, val category: String)
data class PmLayoutPlanUiModel(val id: String, val name: String, val furnitureIds: List<String>)
data class PmProjectUiModel(val id: String, val name: String, val shared: Boolean, val plans: List<PmLayoutPlanUiModel>, val baseRoomId: Int? = null)

/** Only external destinations. Implement on an ancestor Fragment or the Activity. */
interface PmProjectNavigation {
    fun onPmPlaceFurniture(projectId: String, planId: String, furniture: List<PmFurnitureUiModel>)
    fun onPmShareProject(projectId: String)
}

/** Feature-local, memory-only state. Survives view recreation, not process death. */
class PmProjectState : ViewModel() {
    val catalog: List<PmFurnitureUiModel>
        get() = FurnitureCatalog.snapshot().map { PmFurnitureUiModel(it.id, it.name, "") }
    var projects = listOf(
        PmProjectUiModel("bedroom", "침실", false, listOf(
            PmLayoutPlanUiModel("south", "남향 배치안", emptyList()),
            PmLayoutPlanUiModel("east", "동향 배치안", emptyList()))),
        PmProjectUiModel("small", "작은방", true, listOf(
            PmLayoutPlanUiModel("small-1", "기본 배치안", emptyList()),
            PmLayoutPlanUiModel("small-2", "창가 배치안", emptyList()),
            PmLayoutPlanUiModel("small-3", "수납 배치안", emptyList())))
    )
        private set
    var projectId: String? = null
    var planId: String? = null
    fun project() = projects.find { it.id == projectId }
    fun plan() = project()?.plans?.find { it.id == planId }
    fun furniture(plan: PmLayoutPlanUiModel) = catalog.filter { it.id in plan.furnitureIds }
    fun back() { if (planId != null) planId = null else projectId = null }
    fun saveProject(id: String?, name: String, shared: Boolean, baseRoomId: Int? = null) {
        if (id == null) projects = projects + PmProjectUiModel(UUID.randomUUID().toString(), name, shared, emptyList(), baseRoomId)
        else projects = projects.map { if (it.id == id) it.copy(name = name, shared = shared) else it }
    }
    fun deleteProject(id: String) { projects = projects.filterNot { it.id == id } }
    private fun updatePlans(transform: (List<PmLayoutPlanUiModel>) -> List<PmLayoutPlanUiModel>) {
        projects = projects.map { if (it.id == projectId) it.copy(plans = transform(it.plans)) else it }
    }
    fun createPlan(name: String) = updatePlans { it + PmLayoutPlanUiModel(UUID.randomUUID().toString(), name, emptyList()) }
    fun duplicatePlan(id: String) = updatePlans { plans ->
        val source = plans.find { it.id == id } ?: return@updatePlans plans
        var suffix = 1
        var name = "${source.name} (복사 $suffix)"
        while (plans.any { it.name == name }) { suffix++; name = "${source.name} (복사 $suffix)" }
        plans + source.copy(id = UUID.randomUUID().toString(), name = name, furnitureIds = source.furnitureIds.toList())
    }
    fun deletePlan(id: String) = updatePlans { it.filterNot { plan -> plan.id == id } }
    fun setFurniture(ids: List<String>) = updatePlans { plans ->
        val availableIds = catalog.map { it.id }.toSet()
        plans.map { if (it.id == planId) it.copy(furnitureIds = ids.distinct().filter { id -> id in availableIds }) else it }
    }
}
