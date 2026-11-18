package com.example.ourroom // 패키지명 변경

import android.content.Intent
import android.os.Bundle
import android.view.*
import android.widget.ImageButton
import android.widget.PopupMenu
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.floatingactionbutton.FloatingActionButton

class RoomFragment : Fragment() {
    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        val view = inflater.inflate(R.layout.fragment_room, container, false)

        // 1. 임시 데이터 생성 (Room DB 연결 전 화면 테스트용)
        val dummyRooms = listOf(
            RoomEntity(1, "내 침실", 4.0f, 3.0f, 1, 1),
            RoomEntity(2, "거실", 5.5f, 4.0f, 2, 2)
        )

        // 2. RecyclerView 세팅
        val recyclerView = view.findViewById<RecyclerView>(R.id.recyclerViewRooms)
        recyclerView.layoutManager = LinearLayoutManager(requireContext())
        recyclerView.adapter = RoomAdapter(dummyRooms)

        // 3. 플로팅 버튼(방 추가) 누르면 방 만들기 화면으로 이동
        val fab = view.findViewById<FloatingActionButton>(R.id.fabAddRoom)
        fab.setOnClickListener {
            val intent = Intent(requireContext(), RoomEditActivity::class.java)
            startActivity(intent)
        }

        return view
    }
}

// RecyclerView 어댑터 (방 목록 그려주는 역할)
class RoomAdapter(private val roomList: List<RoomEntity>) : RecyclerView.Adapter<RoomAdapter.RoomViewHolder>() {
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
                    1 -> Toast.makeText(it.context, "${room.name} 수정 클릭", Toast.LENGTH_SHORT).show()
                    2 -> Toast.makeText(it.context, "${room.name} 삭제 클릭", Toast.LENGTH_SHORT).show()
                }
                true
            }
            popup.show()
        }
    }

    override fun getItemCount() = roomList.size
}