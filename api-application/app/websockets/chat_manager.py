import asyncio
import time
from typing import Dict, List, Tuple, Set
from starlette.websockets import WebSocket, WebSocketDisconnect, WebSocketState

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[Tuple[WebSocket, int]]] = {}
        self.user_rooms: Dict[int, Set[int]] = {}
        self.user_connections: Dict[int, Set[WebSocket]] = {}
        self.heartbeats: Dict[WebSocket, asyncio.Task] = {}

    async def start_heartbeat(self, websocket: WebSocket, interval: int = 20):
        try:
            while True:
                await asyncio.sleep(interval)
                if websocket.application_state != WebSocketState.CONNECTED:
                    break
                try:
                    await asyncio.wait_for(
                        websocket.send_json({"type": "ping", "ts": time.time()}),
                        timeout=1.0
                    )
                except (RuntimeError, asyncio.TimeoutError):
                    # Socket is busy or temporarily blocked; skip this heartbeat
                    continue
        except Exception:
            pass

    async def connect(self, websocket: WebSocket, user_id: int, room_id: int | None):
        self.remove_socket_everywhere(websocket)
        websocket.state.user_id = user_id
        self.user_connections.setdefault(user_id, set()).add(websocket)

        # If joining a room
        if room_id is not None:
            self.active_connections.setdefault(room_id, []).append((websocket, user_id))
            self.user_rooms.setdefault(user_id, set()).add(room_id)

            # Broadcast to others that this user is online
            await self.broadcast_to_room(
                room_id,
                {"type": "presence", "userId": user_id, "online": True},
                exclude_user_id=user_id
            )

            # Send info about users already online in this room to the connecting websocket
            online_users = self.get_online_users(room_id) - {user_id}
            for uid in online_users:
                await websocket.send_json({"type": "presence", "userId": uid, "online": True})

        # Start heartbeat for this socket
        self.heartbeats[websocket] = asyncio.create_task(self.start_heartbeat(websocket))

    def disconnect(self, websocket: WebSocket, user_id: int, room_id: int | None = None):
        task = self.heartbeats.pop(websocket, None)
        if task:
            task.cancel()

        if user_id in self.user_connections:
            self.user_connections[user_id].discard(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]

        if room_id is not None and room_id in self.active_connections:
            self.active_connections[room_id] = [
                (ws, uid) for ws, uid in self.active_connections[room_id] if ws != websocket
            ]
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

        if room_id is not None and user_id in self.user_rooms:
            self.user_rooms[user_id].discard(room_id)
            if not self.user_rooms[user_id]:
                del self.user_rooms[user_id]

        # Always remove websocket from everywhere to be safe
        self.remove_socket_everywhere(websocket)

    async def broadcast_to_room(self, room_id: int, message: dict, exclude_user_id: int | None = None):
        """Broadcast message to all users in a room safely"""
        if room_id not in self.active_connections:
            return

        coros = []
        for ws, uid in list(self.active_connections[room_id]):
            if exclude_user_id is not None and uid == exclude_user_id:
                continue
            coros.append(self._safe_send(ws, message, room_id, uid))

        if coros:
            await asyncio.gather(*coros)

    async def broadcast_typing(self, room_id: int, user_id: int, is_typing: bool):
        """Broadcast typing event to room"""
        if room_id not in self.active_connections:
            return
        message = {"type": "typing", "user_id": user_id, "is_typing": is_typing}
        coros = [
            self._safe_send(ws, message, room_id, uid)
            for ws, uid in self.active_connections[room_id]
            if uid != user_id
        ]
        if coros:
            await asyncio.gather(*coros)

    async def broadcast_to_user(self, user_id: int, message: dict):
        """Send message to all connections of a specific user"""
        sockets = list(self.user_connections.get(user_id, []))
        coros = [self._safe_send(ws, message) for ws in sockets]
        if coros:
            await asyncio.gather(*coros)

    async def _safe_send(self, ws: WebSocket, message: dict, room_id: int | None = None, uid: int | None = None):
        """Send message safely without dropping websocket for temporary errors"""
        try:
            await ws.send_json(message)
        except WebSocketDisconnect:
            if room_id and uid is not None:
                self.active_connections.get(room_id, []).remove((ws, uid))
            self.remove_socket_everywhere(ws)
        except Exception as e:
            # Just log and ignore other temporary send errors
            print(f"[WebSocketManager] Warning: failed to send message: {e}")

    def get_online_users(self, room_id: int) -> set[int]:
        return {uid for _, uid in self.active_connections.get(room_id, [])}

    def remove_socket_everywhere(self, websocket: WebSocket):
        """Remove websocket from all rooms and user connections"""
        for room_id in list(self.active_connections.keys()):
            self.active_connections[room_id] = [
                (ws, uid) for ws, uid in self.active_connections[room_id] if ws != websocket
            ]
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

        # Remove from user_connections
        for user_id in list(self.user_connections.keys()):
            self.user_connections[user_id].discard(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
    def get_user_rooms(self, user_id: int) -> set[int]:
        """Return all rooms a user is currently connected to"""
        return self.user_rooms.get(user_id, set())
    
    async def broadcast_call_event(
        self,
        user_ids: list[int],
        event: str,
        payload: dict
    ):
        """
        Example events: "call.incoming", "call.ended"
        """
        coros = []
        for uid in user_ids:
            coros.extend([self._safe_send(ws, {"type": event, **payload}) 
                        for ws in self.user_connections.get(uid, [])])
        if coros:
            await asyncio.gather(*coros)

manager = ConnectionManager()
