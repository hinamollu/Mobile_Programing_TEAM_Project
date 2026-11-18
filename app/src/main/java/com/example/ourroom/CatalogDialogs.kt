package com.example.ourroom

import androidx.appcompat.app.AlertDialog
import androidx.core.content.ContextCompat
import com.mobileprograming.teamproject.R

internal fun AlertDialog.applyProjectButtonColor() {
    val teal = ContextCompat.getColor(context, R.color.pm_teal)
    getButton(AlertDialog.BUTTON_NEGATIVE).setTextColor(teal)
    getButton(AlertDialog.BUTTON_POSITIVE).setTextColor(teal)
}
