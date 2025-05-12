import pytest
from fastapi import status

def test_create_classroom(client):
    """Test creating a new classroom."""
    classroom_data = {
        "name": "Test Classroom",
        "capacity": 30,
        "type": "Theoretical",
        "faculty": "Engineering",
        "department": "Computer Science"
    }
    response = client.post("/api/classrooms", json=classroom_data)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == classroom_data["name"]
    assert data["capacity"] == classroom_data["capacity"]

def test_get_classrooms(client, test_classroom):
    """Test getting all classrooms."""
    response = client.get("/api/classrooms")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert any(classroom["name"] == test_classroom.name for classroom in data)

def test_get_classroom(client, test_classroom):
    """Test getting a specific classroom."""
    response = client.get(f"/api/classrooms/{test_classroom.id}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == test_classroom.name
    assert data["capacity"] == test_classroom.capacity

def test_update_classroom(client, test_classroom):
    """Test updating a classroom."""
    update_data = {
        "name": "Updated Classroom",
        "capacity": 40,
        "type": "Lab",
        "faculty": "Updated Faculty",
        "department": "Updated Department"
    }
    response = client.put(f"/api/classrooms/{test_classroom.id}", json=update_data)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == update_data["name"]
    assert data["capacity"] == update_data["capacity"]

def test_delete_classroom(client, test_classroom):
    """Test deleting a classroom."""
    response = client.delete(f"/api/classrooms/{test_classroom.id}")
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["detail"] == "Classroom deleted successfully"

def test_get_nonexistent_classroom(client):
    """Test getting a non-existent classroom."""
    response = client.get("/api/classrooms/999")
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_create_duplicate_classroom(client, test_classroom):
    """Test creating a classroom with duplicate name."""
    classroom_data = {
        "name": test_classroom.name,
        "capacity": 30,
        "type": "Theoretical",
        "faculty": "Engineering",
        "department": "Computer Science"
    }
    response = client.post("/api/classrooms", json=classroom_data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST 