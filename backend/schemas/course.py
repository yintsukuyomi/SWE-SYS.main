from pydantic import BaseModel
from enum import Enum
from typing import List

class CourseType(str, Enum):
    teorik = "teorik"
    lab = "lab"

class CourseCategory(str, Enum):
    zorunlu = "zorunlu"
    secmeli = "secmeli"

class CourseSessionCreate(BaseModel):
    type: str
    hours: int

class CourseDepartmentCreate(BaseModel):
    department: str
    student_count: int

class CourseCreate(BaseModel):
    name: str
    code: str
    teacher_id: int
    faculty: str
    level: str
    category: CourseCategory
    semester: str
    ects: int
    is_active: bool
    sessions: List[CourseSessionCreate]
    departments: List[CourseDepartmentCreate]

class CourseSessionResponse(BaseModel):
    id: int
    type: str
    hours: int

class CourseDepartmentResponse(BaseModel):
    id: int
    department: str
    student_count: int

class CourseResponse(BaseModel):
    id: int
    name: str
    code: str
    teacher_id: int
    faculty: str
    level: str
    category: str
    semester: str
    ects: int
    is_active: bool
    sessions: List[CourseSessionResponse]
    departments: List[CourseDepartmentResponse]
    teacher: dict = None 