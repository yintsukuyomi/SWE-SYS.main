from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_notifications():
    return {"notifications": "This is the notifications endpoint"}
