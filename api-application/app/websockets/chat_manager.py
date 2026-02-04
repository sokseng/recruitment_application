from fastapi import WebSocket
from typing import Dict, Set

from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, list[tuple[WebSocket, int]]] = {}
        self.user_rooms: dict[int, set[int]] = {}

    async def connect(self, websocket: WebSocket, user_id: int, room_id: int):
        websocket.state.user_id = user_id

        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append((websocket, user_id))
        
        if user_id not in self.user_rooms:
            self.user_rooms[user_id] = set()
        self.user_rooms[user_id].add(room_id)
        
        for _, uid in self.active_connections[room_id]:
            if uid != user_id:
                await websocket.send_json({
                    "type": "presence",
                    "userId": uid,
                    "online": True
                })

    def disconnect(self, websocket: WebSocket, user_id: int, room_id: int):
        if room_id in self.active_connections:
            self.active_connections[room_id] = [
                (ws, uid) for ws, uid in self.active_connections[room_id] if ws != websocket
            ]
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]
            
        if user_id in self.user_rooms:
            self.user_rooms[user_id].discard(room_id)
            if not self.user_rooms[user_id]:
                del self.user_rooms[user_id]

    async def broadcast_to_room(self, room_id: int, message: dict, exclude_user_id: int | None = None):
        print("BROADCAST TO ROOM:", room_id, message)
        if room_id not in self.active_connections:
            print("NO ACTIVE CONNECTIONS FOR ROOM")
            return

        for ws, uid in self.active_connections[room_id][:]:
            if exclude_user_id is not None and uid == exclude_user_id:
                continue
            try:
                await ws.send_json(message)
            except RuntimeError:
                self.active_connections[room_id].remove((ws, uid))
            except Exception as e:
                print(f"Error sending to websocket: {e}")
                
    async def broadcast_typing(self, room_id: int, user_id: int, is_typing: bool):
        if room_id not in self.active_connections:
            return 
        
        message = {
            "type": "typing",
            "user_id": user_id,
            "is_typing": is_typing
        }
        
        for ws, uid in self.active_connections[room_id][:]:
            if uid != user_id: # don't send typing event back to the user themselves
                try:
                    await ws.send_json(message)
                except RuntimeError:
                    self.active_connections[room_id].remove((ws, uid))
                except Exception as e:
                    print(f"Error sending typing event: {e}")
                    
    def get_online_users(self, room_id: int) -> set[int]:
        if room_id not in self.active_connections:
            return set()
        return {uid for _, uid in self.active_connections[room_id]}

manager = ConnectionManager()