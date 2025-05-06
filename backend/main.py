from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers import schedule, notifications
from routers.auth import router as auth_router  # Yeni auth router'ı eklendi

app = FastAPI()

# CORS yapılandırması
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Gerekirse belirli domainlerle sınırlandırabilirsiniz
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Veritabanını başlat
init_db()

app.include_router(schedule.router, prefix="/api/schedule", tags=["Schedule"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])  # Yeni auth router'ı eklendi

@app.get("/")
def read_root():
    return {"message": "Welcome to SWE-SYS Backend"}