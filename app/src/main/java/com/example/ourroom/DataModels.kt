package com.example.ourroom

import androidx.room.Entity
import androidx.room.PrimaryKey

// 1. 방 데이터 구조 (문 개수, 창문 개수 포함)
@Entity(tableName = "room_table")
data class RoomEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val name: String,
    val width: Float,  // 가로 길이 (mm)
    val height: Float, // 세로 길이 (mm)
    val doorCount: Int,
    val windowCount: Int
)

// 2. 가구 데이터 구조 (가로, 세로, 높이 포함)
@Entity(tableName = "furniture_table")
data class FurnitureEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val name: String,
    val width: Float,  // 가로 (mm)
    val depth: Float,  // 세로 (깊이, mm)
    val height: Float  // 높이 (mm)
)