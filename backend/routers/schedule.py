from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_schedule():
    return {"schedule": "This is the schedule endpoint"}
