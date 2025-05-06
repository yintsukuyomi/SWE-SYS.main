from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer
import os
from dotenv import load_dotenv

# Ortam değişkenlerini yükle
load_dotenv()

router = APIRouter()

# Şifreleme ve JWT ayarları
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Değişkenler için varsayılan değerler belirleme ve kontrol
if not SECRET_KEY:
    SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"  # Varsayılan anahtar
    print("WARNING: Using default SECRET_KEY. Set this in your .env file for security.")

if not ALGORITHM:
    ALGORITHM = "HS256"  # Varsayılan algoritma
    print("WARNING: Using default ALGORITHM. Set this in your .env file.")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# Kullanıcı modeli
class User(BaseModel):
    username: str
    password: str

class TokenData(BaseModel):
    username: str = None
    role: str = None

# Örnek kullanıcı verisi
fake_users_db = {
    "admin": {
        "username": "admin",
        "hashed_password": pwd_context.hash("admin123"),
        "role": "admin",
        "permissions": ["read", "write", "delete", "admin"]
    },
    "teacher": {
        "username": "teacher",
        "hashed_password": pwd_context.hash("teacher123"),
        "role": "teacher",
        "permissions": ["read", "limited_write"]
    },
}

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def authenticate_user(username: str, password: str):
    user = fake_users_db.get(username)
    if not user or not verify_password(password, user["hashed_password"]):
        return None
    return user

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
    to_encode.update({"exp": expire})
    
    # Debug bilgileri
    print(f"Encoding JWT with: SECRET_KEY length={len(SECRET_KEY)}, ALGORITHM={ALGORITHM}")
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if username is None or role is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user_data = fake_users_db.get(username, {})
        return {"username": username, "role": role, "permissions": user_data.get("permissions", [])}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def check_admin_permission(current_user: dict = Depends(get_current_user)):
    if "admin" not in current_user.get("permissions", []):
        raise HTTPException(
            status_code=403, 
            detail="You do not have permission to perform this action. Admin access required."
        )
    return current_user

@router.post("/login")
def login(user: User):
    authenticated_user = authenticate_user(user.username, user.password)
    if not authenticated_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Token süresi
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Token içeriği
    token_data = {
        "sub": user.username, 
        "role": authenticated_user["role"], 
        "permissions": authenticated_user["permissions"]
    }
    
    # Token oluşturma
    access_token = create_access_token(
        data=token_data,
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user
