import pytest
from fastapi import status
from sqlalchemy.orm import Session
from models import Schedule

def test_create_course(client, test_teacher):
    """Test creating a new course."""
    course_data = {
        "name": "Test Course",
        "code": "TEST101",
        "teacher_id": test_teacher.id,
        "faculty": "Engineering",
        "department": "Computer Science",
        "level": "Bachelor",
        "type": "teorik",
        "category": "zorunlu",
        "semester": "Fall",
        "ects": 6,
        "total_hours": 3,
        "is_active": True,
        "student_count": 25
    }
    response = client.post("/api/courses", json=course_data)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == course_data["name"]
    assert data["code"] == course_data["code"]
    assert data["type"] == course_data["type"]
    assert data["category"] == course_data["category"]

def test_create_course_invalid_type(client, test_teacher):
    """Test creating a course with invalid type."""
    course_data = {
        "name": "Test Course",
        "code": "TEST102",
        "teacher_id": test_teacher.id,
        "faculty": "Engineering",
        "department": "Computer Science",
        "level": "Bachelor",
        "type": "invalid_type",
        "category": "zorunlu",
        "semester": "Fall",
        "ects": 6,
        "total_hours": 3,
        "is_active": True,
        "student_count": 25
    }
    response = client.post("/api/courses", json=course_data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_create_course_invalid_category(client, test_teacher):
    """Test creating a course with invalid category."""
    course_data = {
        "name": "Test Course",
        "code": "TEST103",
        "teacher_id": test_teacher.id,
        "faculty": "Engineering",
        "department": "Computer Science",
        "level": "Bachelor",
        "type": "teorik",
        "category": "invalid_category",
        "semester": "Fall",
        "ects": 6,
        "total_hours": 3,
        "is_active": True,
        "student_count": 25
    }
    response = client.post("/api/courses", json=course_data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_get_courses(client, test_course):
    """Test getting all courses."""
    response = client.get("/api/courses")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert any(course["name"] == test_course.name for course in data)

def test_get_course(client, test_course):
    """Test getting a specific course."""
    response = client.get(f"/api/courses/{test_course.id}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == test_course.name
    assert data["code"] == test_course.code

def test_update_course(client, test_course):
    """Test updating a course."""
    update_data = {
        "name": "Updated Course",
        "code": "UPD101",
        "teacher_id": test_course.teacher_id,
        "faculty": "Updated Faculty",
        "department": "Updated Department",
        "level": "Master",
        "type": "teorik",
        "category": "secmeli",
        "semester": "Spring",
        "ects": 4,
        "total_hours": 2,
        "is_active": True,
        "student_count": 20
    }
    response = client.put(f"/api/courses/{test_course.id}", json=update_data)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == update_data["name"]
    assert data["code"] == update_data["code"]

def test_delete_course(client, test_course):
    """Test deleting a course."""
    response = client.delete(f"/api/courses/{test_course.id}")
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["detail"] == "Course deleted successfully"

def test_get_nonexistent_course(client):
    """Test getting a non-existent course."""
    response = client.get("/api/courses/999")
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_get_unscheduled_courses(client, test_course, db):
    """Test getting unscheduled courses."""
    # Ensure the course is unscheduled by deleting any existing schedules
    db.query(Schedule).filter(Schedule.course_id == test_course.id).delete()
    db.commit()
    
    response = client.get("/api/courses/unscheduled")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert any(course["name"] == test_course.name for course in data) 