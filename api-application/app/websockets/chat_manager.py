from fastapi import WebSocket
from typing import Dict, Set


class ConnectionManager:
    def __init__(self):
        # user_id → room_id → set[WebSocket]
        self.active: Dict[int, Dict[int, Set[WebSocket]]] = {}

    async def connect(self, ws: WebSocket, user_id: int, room_id: int):
        await ws.accept()
        if user_id not in self.active:
            self.active[user_id] = {}
        if room_id not in self.active[user_id]:
            self.active[user_id][room_id] = set()
        self.active[user_id][room_id].add(ws)

    def disconnect(self, ws: WebSocket, user_id: int, room_id: int):
        if user_id in self.active and room_id in self.active[user_id]:
            self.active[user_id][room_id].discard(ws)
            if not self.active[user_id][room_id]:
                del self.active[user_id][room_id]
            if not self.active[user_id]:
                del self.active[user_id]

    async def send_to_user_in_room(self, user_id: int, room_id: int, msg: dict):
        if user_id in self.active and room_id in self.active[user_id]:
            for ws in self.active[user_id][room_id]:
                await ws.send_json(msg)

    async def broadcast_to_room(self, room_id: int, msg: dict, exclude_user_id: int | None = None):
        for uid, rooms in self.active.items():
            if room_id in rooms:
                for ws in rooms[room_id]:
                    if exclude_user_id is None or uid != exclude_user_id:
                        await ws.send_json(msg)


manager = ConnectionManager()