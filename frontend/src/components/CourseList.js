import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getCourses, deleteCourse } from "../api";
import "../styles/CourseList.css";

const CourseList = ({ token }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    courseId: null,
    courseName: ''
  });

  useEffect(() => {
    fetchCourses();
  }, [token]);

  const fetchCourses = async () => {
    try {
      const data = await getCourses(token);
      setCourses(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching courses:", error);
      setError("Failed to load courses");
      setLoading(false);
    }
  };

  const handleDeleteClick = (id, name) => {
    setDeleteConfirm({
      show: true,
      courseId: id,
      courseName: name
    });
  };

  const cancelDelete = () => {
    setDeleteConfirm({
      show: false,
      courseId: null,
      courseName: ''
    });
  };

  const confirmDelete = async () => {
    try {
      await deleteCourse(deleteConfirm.courseId, token);
      setDeleteConfirm({
        show: false,
        courseId: null,
        courseName: ''
      });
      // Ders listesini yeniden yükle
      fetchCourses();
    } catch (error) {
      console.error("Error deleting course:", error);
      setError("Failed to delete course. " + (error.detail || ""));
    }
  };

  return (
    <div className="course-list-container">
      <div className="course-header">
        <h1>Courses</h1>
        <Link to="/courses/new" className="add-course-btn">
          <span className="btn-icon">+</span> Add New Course
        </Link>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {deleteConfirm.show && (
        <div className="modal-backdrop">
          <div className="delete-confirmation-modal">
            <div className="modal-header">
              <h3>Delete Confirmation</h3>
              <button className="close-button" onClick={cancelDelete}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{deleteConfirm.courseName}</strong>?</p>
              <p className="warning-text">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button onClick={cancelDelete} className="btn-cancel">Cancel</button>
              <button onClick={confirmDelete} className="btn-delete">Delete</button>
            </div>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="loading">Loading courses...</div>
      ) : (
        <table className="course-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Teacher</th>
              <th>Faculty</th>
              <th>Department</th>
              <th>Level</th>
              <th>ECTS</th>
              <th>Students</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.length === 0 ? (
              <tr>
                <td colSpan="10" className="no-data">No courses found</td>
              </tr>
            ) : (
              courses.map(course => (
                <tr key={course.id}>
                  <td>{course.name}</td>
                  <td>{course.code}</td>
                  <td>{course.teacher ? course.teacher.name : (course.teacher_id ? 'Loading...' : 'No teacher assigned')}</td>
                  <td>{course.faculty}</td>
                  <td>{course.department}</td>
                  <td>{course.level}</td>
                  <td>{course.ects}</td>
                  <td>{course.student_count}</td>
                  <td>
                    <span className={`status-badge ${course.is_active ? 'active' : 'inactive'}`}>
                      {course.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <Link 
                      to={`/courses/edit/${course.id}`} 
                      className="btn-edit"
                    >
                      Edit
                    </Link>
                    <button 
                      className="btn-delete" 
                      onClick={() => handleDeleteClick(course.id, course.name)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CourseList;
