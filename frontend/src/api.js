import axios from "axios";

const API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000/api";

// Auth API calls
export const login = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, { username, password });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const getCurrentUser = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

// Teachers API calls
export const getTeachers = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/teachers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const getTeacherById = async (id, token) => {
  try {
    const response = await axios.get(`${API_URL}/teachers/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const createTeacher = async (teacherData, token) => {
  try {
    const response = await axios.post(`${API_URL}/teachers`, teacherData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const updateTeacher = async (id, teacherData, token) => {
  try {
    const response = await axios.put(`${API_URL}/teachers/${id}`, teacherData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const deleteTeacher = async (id, token) => {
  try {
    const response = await axios.delete(`${API_URL}/teachers/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

// Schedules API calls
export const getSchedules = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/schedules`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const createSchedule = async (scheduleData, token) => {
  try {
    const response = await axios.post(`${API_URL}/schedules`, scheduleData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

// Courses API calls
export const getCourses = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/courses`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const getCourseById = async (id, token) => {
  try {
    const response = await axios.get(`${API_URL}/courses/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const createCourse = async (courseData, token) => {
  try {
    const response = await axios.post(`${API_URL}/courses`, courseData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const updateCourse = async (id, courseData, token) => {
  try {
    const response = await axios.put(`${API_URL}/courses/${id}`, courseData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const deleteCourse = async (id, token) => {
  try {
    const response = await axios.delete(`${API_URL}/courses/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

// Classrooms API calls
export const getClassrooms = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/classrooms`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const getClassroomById = async (id, token) => {
  try {
    const response = await axios.get(`${API_URL}/classrooms/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const createClassroom = async (classroomData, token) => {
  try {
    const response = await axios.post(`${API_URL}/classrooms`, classroomData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const updateClassroom = async (id, classroomData, token) => {
  try {
    const response = await axios.put(`${API_URL}/classrooms/${id}`, classroomData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const deleteClassroom = async (id, token) => {
  try {
    const response = await axios.delete(`${API_URL}/classrooms/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

// Statistics API call
export const getStatistics = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/statistics/`, {  // URL sonuna / ekledik
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching statistics:", error);
    // Hata yakalama ve işleme iyileştirildi
    throw error.response ? error.response.data : { detail: "Network error or server unavailable" };
  }
};
