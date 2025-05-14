from fastapi import APIRouter, WebSocket

router = APIRouter()

@router.get("/")
def get_notifications():
    return {"notifications": "This is the notifications endpoint"}

@router.websocket("/ws/notifications")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_text()
        await websocket.send_text(f"Notification received: {data}") 