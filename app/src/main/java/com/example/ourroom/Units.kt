package com.example.ourroom

import kotlin.math.roundToLong

/**
 * 앱 전체의 길이 단위는 mm 정수다. 서버 API(모든 길이는 정수 mm, 1~100000)와 같은 규칙이다.
 * 방/가구 입력, 목록 표시, 배치 화면이 모두 이 객체를 거쳐서 단위를 맞춘다.
 */
object Mm {
    const val MIN = 1
    const val MAX = 100_000

    /** 입력창 글자 -> mm 정수. 정수가 아니거나 1~100000 범위를 벗어나면 null. */
    fun parse(text: String): Int? = text.trim().toIntOrNull()?.takeIf { it in MIN..MAX }

    /** 화면 표시용. 4000.0 -> "4000" (소수점 없이). */
    fun format(value: Double): String =
        if (value.isFinite()) value.roundToLong().toString() else "0"

    fun format(value: Float): String = format(value.toDouble())
}
