import pytest
from fastapi import status

def test_create_schedule(client, test_course, test_classroom):
    """Test creating a new schedule."""
    schedule_data = {
        "day": "Monday",
        "time_range": "09:00-10:30",
        "course_id": test_course.id,
        "classroom_id": test_classroom.id
    }
    response = client.post("/api/schedules", json=schedule_data)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["day"] == schedule_data["day"]
    assert data["time_range"] == schedule_data["time_range"]

def test_get_schedules(client, test_schedule):
    """Test getting all schedules."""
    response = client.get("/api/schedules")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert any(schedule["day"] == test_schedule.day for schedule in data)

def test_get_schedule(client, test_schedule):
    """Test getting a specific schedule."""
    response = client.get(f"/api/schedules/{test_schedule.id}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["day"] == test_schedule.day
    assert data["time_range"] == test_schedule.time_range

def test_delete_schedule(client, test_schedule):
    """Test deleting a schedule."""
    response = client.delete(f"/api/schedules/{test_schedule.id}")
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["detail"] == "Schedule deleted successfully"

def test_delete_schedules_by_day(client, test_schedule):
    """Test deleting all schedules for a specific day."""
    response = client.delete(f"/api/schedules/day/{test_schedule.day}")
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["detail"] == f"All schedules for {test_schedule.day} deleted successfully"

def test_update_schedule(client, test_schedule):
    """Test updating a schedule."""
    update_data = {
        "day": "Tuesday",
        "time_range": "10:00-11:30",
        "course_id": test_schedule.course_id,
        "classroom_id": test_schedule.classroom_id
    }
    response = client.put(f"/api/schedules/{test_schedule.id}", json=update_data)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["day"] == update_data["day"]
    assert data["time_range"] == update_data["time_range"]

def test_get_nonexistent_schedule(client):
    """Test getting a non-existent schedule."""
    response = client.get("/api/schedules/999")
    assert response.status_code == status.HTTP_404_NOT_FOUND 