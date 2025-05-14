from pydantic import BaseModel

class TeacherCreate(BaseModel):
    name: str
    email: str
    faculty: str
    department: str
    working_hours: str

class TeacherResponse(BaseModel):
    id: int
    name: str
    email: str
    faculty: str
    department: str
    working_hours: str 