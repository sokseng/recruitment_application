from fastapi import WebSocket
from typing import Dict, Set

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int, room_id: int):
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int, room_id: int):
        if room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)

    async def broadcast_to_room(self, room_id: int, message: dict, exclude_user_id: int | None = None):
        if room_id not in self.active_connections:
            return

        for ws in self.active_connections[room_id][:]:
            try:
                await ws.send_json(message)
            except RuntimeError:
                self.active_connections[room_id].remove(ws)
            except Exception as e:
                print(f"Error sending to websocket: {e}")

manager = ConnectionManager()