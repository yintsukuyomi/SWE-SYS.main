from fastapi import FastAPI
from database import init_db
from routers import schedule, notifications

app = FastAPI()

# Veritabanını başlat
init_db()

app.include_router(schedule.router, prefix="/api/schedule", tags=["Schedule"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])

@app.get("/")
def read_root():
    return {"message": "Welcome to SWE-SYS Backend"}