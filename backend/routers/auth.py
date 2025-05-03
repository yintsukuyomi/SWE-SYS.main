from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer
import os

router = APIRouter()

# Şifreleme ve JWT ayarları
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = 30

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
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

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
    access_token = create_access_token(
        data={"sub": user.username, "role": authenticated_user["role"], "permissions": authenticated_user["permissions"]}
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user
