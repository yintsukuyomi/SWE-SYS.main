from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from database import init_db
from app.api.endpoints.courses import router as courses_router
from app.api.endpoints.teachers import router as teachers_router
from app.api.endpoints.schedules import router as schedules_router
from app.api.endpoints.auth import router as auth_router
from app.api.endpoints.classrooms import router as classrooms_router
from app.api.endpoints.statistics import router as statistics_router
from app.api.endpoints.notifications import router as notifications_router
from app.api.endpoints.schedule import router as schedule_router
from app.api.endpoints.scheduler import router as scheduler_router
import time
import logging
from dotenv import load_dotenv

# Ortam değişkenlerini yükle
load_dotenv()

# Günlük kaydı yapılandırması
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)

app = FastAPI(
    title="SWE-SYS Backend API",
    description="API for managing schedules, notifications, and authentication in SWE-SYS Education Management System.",
    version="1.0.0",
)

# CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React frontend'inizin URL'si
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# İstek işleme süresi middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    logging.info(f"Request to {request.url.path} processed in {process_time:.4f} seconds")
    return response

# Genel hata yakalama
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logging.error(f"Unexpected error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred."}
    )

# Veritabanını başlat
init_db()

# Router'ları dahil et
app.include_router(courses_router, prefix="/api/courses", tags=["Courses"])
app.include_router(teachers_router, prefix="/api/teachers", tags=["Teachers"])
app.include_router(schedules_router, prefix="/api/schedules", tags=["Schedules"])
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(classrooms_router, prefix="/api/classrooms", tags=["Classrooms"])
app.include_router(statistics_router, prefix="/api/statistics", tags=["Statistics"])
app.include_router(notifications_router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(schedule_router, prefix="/api/schedule", tags=["Schedule"])
app.include_router(scheduler_router, prefix="/api/scheduler", tags=["Scheduler"])

@app.get("/")
def read_root():
    return {
        "message": "Welcome to SWE-SYS Backend",
        "version": "1.0.0",
        "documentation": "/docs",
        "redoc": "/redoc"
    }

@app.get("/api/health")
def health_check():
    """Health check endpoint to verify the API is running"""
    return {"status": "healthy"}