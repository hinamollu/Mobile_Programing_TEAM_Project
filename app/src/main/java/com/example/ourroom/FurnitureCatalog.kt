package com.example.ourroom

import java.util.UUID

internal data class CatalogFurniture(
    val id: String,
    val name: String,
    val width: Double,
    val depth: Double
)

/** Process-local catalog shared by the furniture tab and project picker. */
internal object FurnitureCatalog {
    private val items = mutableListOf<CatalogFurniture>()

    fun snapshot(): List<CatalogFurniture> = items.toList()

    fun find(id: String): CatalogFurniture? = items.find { it.id == id }

    fun save(id: String?, name: String, width: Double, depth: Double) {
        if (id == null) {
            items.add(CatalogFurniture(UUID.randomUUID().toString(), name, width, depth))
        } else {
            val index = items.indexOfFirst { it.id == id }
            if (index >= 0) items[index] = CatalogFurniture(id, name, width, depth)
        }
    }

    fun delete(id: String) {
        items.removeAll { it.id == id }
    }
}
