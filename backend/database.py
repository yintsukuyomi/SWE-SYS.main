from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, scoped_session
from dotenv import load_dotenv
import os

# Ortam değişkenlerini yükle
load_dotenv()

# Veritabanı yolu
DATABASE_URL = os.getenv("DATABASE_URL")

# Veritabanı klasörünü kontrol et ve oluştur
os.makedirs(os.path.dirname(DATABASE_URL.split("///")[1]), exist_ok=True)

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))
Base = declarative_base()

def init_db():
    Base.metadata.create_all(bind=engine)
    print("Database initialized successfully.")
