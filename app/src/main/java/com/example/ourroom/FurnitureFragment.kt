package com.example.ourroom

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import android.widget.ImageView
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.widget.PopupMenu
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.mobileprograming.teamproject.R

class FurnitureFragment : Fragment(R.layout.fragment_furniture) {
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        view.findViewById<RecyclerView>(R.id.recyclerViewFurniture).layoutManager =
            LinearLayoutManager(requireContext())
        view.findViewById<View>(R.id.fabAddFurniture).setOnClickListener {
            startActivity(Intent(requireContext(), FurnitureEditActivity::class.java))
        }
    }

    override fun onResume() {
        super.onResume()
        refreshFurniture()
    }

    private fun refreshFurniture() {
        requireView().findViewById<RecyclerView>(R.id.recyclerViewFurniture).adapter =
            FurnitureAdapter(FurnitureCatalog.snapshot(), onEdit = { item ->
                startActivity(Intent(requireContext(), FurnitureEditActivity::class.java)
                    .putExtra(FurnitureEditActivity.EXTRA_FURNITURE_ID, item.id))
            }, onDelete = { item ->
                AlertDialog.Builder(requireContext())
                    .setTitle("가구를 삭제하시겠습니까?")
                    .setMessage(item.name)
                    .setNegativeButton(R.string.pm_cancel, null)
                    .setPositiveButton(R.string.pm_delete) { _, _ ->
                        FurnitureCatalog.delete(item.id)
                        refreshFurniture()
                    }.show().applyProjectButtonColor()
            })
    }
}

private class FurnitureAdapter(
    private val furniture: List<CatalogFurniture>,
    private val onEdit: (CatalogFurniture) -> Unit,
    private val onDelete: (CatalogFurniture) -> Unit
) :
    RecyclerView.Adapter<FurnitureAdapter.Holder>() {
    class Holder(view: View) : RecyclerView.ViewHolder(view) {
        val title: TextView = view.findViewById(R.id.tvTitle)
        val subtitle: TextView = view.findViewById(R.id.tvSub)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): Holder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_card, parent, false)
        view.findViewById<ImageView>(R.id.catalogImage).setImageResource(R.drawable.pm_furniture)
        return Holder(view)
    }

    override fun onBindViewHolder(holder: Holder, position: Int) {
        val item = furniture[position]
        holder.title.text = item.name
        holder.subtitle.text = "${item.width}m × ${item.depth}m"
        holder.itemView.findViewById<View>(R.id.btnMore).setOnClickListener { anchor ->
            PopupMenu(anchor.context, anchor).apply {
                menu.add("가구 수정").setOnMenuItemClickListener { onEdit(item); true }
                menu.add("가구 삭제").setOnMenuItemClickListener { onDelete(item); true }
                show()
            }
        }
    }

    override fun getItemCount() = furniture.size
}
