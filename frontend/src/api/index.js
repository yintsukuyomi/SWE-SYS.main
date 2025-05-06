import axios from 'axios';

const BASE_URL = 'http://localhost:8000';

export const getCourses = async (token) => {
  const response = await axios.get(`${BASE_URL}/api/courses`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });
  return response.data;
};

export const deleteCourse = async (courseId, token) => {
  const response = await axios.delete(`${BASE_URL}/api/courses/${courseId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });
  return response.data;
};

export const updateCourse = async (courseId, courseData, token) => {
  try {
    const response = await axios.put(`${BASE_URL}/api/courses/${courseId}`, courseData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};