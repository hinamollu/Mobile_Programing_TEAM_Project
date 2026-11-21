package com.example.ourroom

internal object RoomCatalog {
    private val rooms = mutableListOf(
        RoomEntity(1, "내 침실", 4000f, 3000f, 1, 1),
        RoomEntity(2, "거실", 5500f, 4000f, 2, 2)
    )
    private var nextId = 3

    fun snapshot(): List<RoomEntity> = rooms.toList()
    fun find(id: Int): RoomEntity? = rooms.find { it.id == id }

    fun save(room: RoomEntity) {
        if (room.id == 0) {
            rooms.add(room.copy(id = nextId++))
        } else {
            val index = rooms.indexOfFirst { it.id == room.id }
            if (index >= 0) rooms[index] = room
        }
    }

    fun delete(id: Int) {
        rooms.removeAll { it.id == id }
    }
}
