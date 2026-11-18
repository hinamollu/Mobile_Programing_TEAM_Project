package com.example.ourroom // 패키지명 변경

import com.mobileprograming.teamproject.R
import android.content.Intent
import android.os.Bundle
import android.view.*
import android.widget.ImageButton
import android.widget.PopupMenu
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.floatingactionbutton.FloatingActionButton

class RoomFragment : Fragment() {
    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        val view = inflater.inflate(R.layout.fragment_room, container, false)

        val recyclerView = view.findViewById<RecyclerView>(R.id.recyclerViewRooms)
        recyclerView.layoutManager = LinearLayoutManager(requireContext())

        // 3. 플로팅 버튼(방 추가) 누르면 방 만들기 화면으로 이동
        val fab = view.findViewById<FloatingActionButton>(R.id.fabAddRoom)
        fab.setOnClickListener {
            val intent = Intent(requireContext(), RoomEditActivity::class.java)
            startActivity(intent)
        }

        return view
    }

    override fun onResume() {
        super.onResume()
        refreshRooms()
    }

    private fun refreshRooms() {
        requireView().findViewById<RecyclerView>(R.id.recyclerViewRooms).adapter =
            RoomAdapter(RoomCatalog.snapshot(), onEdit = { room ->
                startActivity(Intent(requireContext(), RoomEditActivity::class.java)
                    .putExtra(RoomEditActivity.EXTRA_ROOM_ID, room.id))
            }, onDelete = { room ->
                AlertDialog.Builder(requireContext())
                    .setTitle("방을 삭제하시겠습니까?")
                    .setMessage(room.name)
                    .setNegativeButton(R.string.pm_cancel, null)
                    .setPositiveButton(R.string.pm_delete) { _, _ ->
                        RoomCatalog.delete(room.id)
                        refreshRooms()
                    }.show().applyProjectButtonColor()
            })
    }
}

// RecyclerView 어댑터 (방 목록 그려주는 역할)
private class RoomAdapter(
    private val roomList: List<RoomEntity>,
    private val onEdit: (RoomEntity) -> Unit,
    private val onDelete: (RoomEntity) -> Unit
) : RecyclerView.Adapter<RoomAdapter.RoomViewHolder>() {
    class RoomViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvTitle: TextView = view.findViewById(R.id.tvTitle)
        val tvSub: TextView = view.findViewById(R.id.tvSub)
        val btnMore: ImageButton = view.findViewById(R.id.btnMore)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RoomViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_card, parent, false)
        return RoomViewHolder(view)
    }

    override fun onBindViewHolder(holder: RoomViewHolder, position: Int) {
        val room = roomList[position]
        holder.tvTitle.text = room.name
        holder.tvSub.text = "크기: ${room.width}m x ${room.height}m / 문: ${room.doorCount}개, 창문: ${room.windowCount}개"

        // 4. 기획하신 `...` 버튼 팝업 띄우기 (수정/삭제)
        holder.btnMore.setOnClickListener {
            val popup = PopupMenu(it.context, holder.btnMore)
            popup.menu.add(Menu.NONE, 1, 1, "방 수정")
            popup.menu.add(Menu.NONE, 2, 2, "방 삭제")
            popup.setOnMenuItemClickListener { menuItem ->
                when (menuItem.itemId) {
                    1 -> onEdit(room)
                    2 -> onDelete(room)
                }
                true
            }
            popup.show()
        }
    }

    override fun getItemCount() = roomList.size
}