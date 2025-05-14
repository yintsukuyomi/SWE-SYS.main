from pydantic import BaseModel

class ScheduleCreate(BaseModel):
    day: str
    time_range: str
    course_id: int
    classroom_id: int

class ScheduleResponse(BaseModel):
    id: int
    day: str
    time_range: str
    course_id: int
    classroom_id: int 