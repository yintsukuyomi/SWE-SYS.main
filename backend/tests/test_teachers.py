import pytest
from fastapi import status

def test_create_teacher(client):
    """Test creating a new teacher."""
    teacher_data = {
        "name": "John Doe",
        "email": "john.doe@example.com",
        "faculty": "Engineering",
        "department": "Computer Science",
        "working_days": "Monday,Tuesday,Wednesday",
        "working_hours": "09:00-17:00"
    }
    response = client.post("/api/teachers", json=teacher_data)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == teacher_data["name"]
    assert data["email"] == teacher_data["email"]

def test_get_teachers(client, test_teacher):
    """Test getting all teachers."""
    response = client.get("/api/teachers")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert any(teacher["name"] == test_teacher.name for teacher in data)

def test_get_teacher(client, test_teacher):
    """Test getting a specific teacher."""
    response = client.get(f"/api/teachers/{test_teacher.id}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == test_teacher.name
    assert data["email"] == test_teacher.email

def test_update_teacher(client, test_teacher):
    """Test updating a teacher."""
    update_data = {
        "name": "Updated Name",
        "email": "updated.teacher@example.com",
        "faculty": "Updated Faculty",
        "department": "Updated Department",
        "working_days": "Monday,Tuesday",
        "working_hours": "10:00-18:00"
    }
    response = client.put(f"/api/teachers/{test_teacher.id}", json=update_data)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == update_data["name"]
    assert data["email"] == update_data["email"]

def test_delete_teacher(client, test_teacher):
    """Test deleting a teacher."""
    response = client.delete(f"/api/teachers/{test_teacher.id}")
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["detail"] == "Teacher deleted successfully"

def test_get_nonexistent_teacher(client):
    """Test getting a non-existent teacher."""
    response = client.get("/api/teachers/999")
    assert response.status_code == status.HTTP_404_NOT_FOUND 