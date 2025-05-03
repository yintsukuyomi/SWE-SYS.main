import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getTeachers, deleteTeacher } from "../api";
import "../styles/TeacherList.css";

const TeacherList = ({ token }) => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    teacherId: null,
    teacherName: ''
  });

  useEffect(() => {
    fetchTeachers();
  }, [token]);

  const fetchTeachers = async () => {
    try {
      const data = await getTeachers(token);
      setTeachers(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      setError("Failed to load teachers");
      setLoading(false);
    }
  };

  const handleDeleteClick = (id, name) => {
    setDeleteConfirm({
      show: true,
      teacherId: id,
      teacherName: name
    });
  };

  const cancelDelete = () => {
    setDeleteConfirm({
      show: false,
      teacherId: null,
      teacherName: ''
    });
  };

  const confirmDelete = async () => {
    try {
      await deleteTeacher(deleteConfirm.teacherId, token);
      setDeleteConfirm({
        show: false,
        teacherId: null,
        teacherName: ''
      });
      // Öğretmen listesini yeniden yükle
      fetchTeachers();
    } catch (error) {
      console.error("Error deleting teacher:", error);
      setError("Failed to delete teacher. " + (error.detail || ""));
    }
  };

  return (
    <div className="teacher-list-container">
      <div className="teacher-header">
        <h1>Teachers</h1>
        <Link to="/teachers/new" className="add-teacher-btn">
          <span className="btn-icon">+</span> Add New Teacher
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
              <p>Are you sure you want to delete <strong>{deleteConfirm.teacherName}</strong>?</p>
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
        <div className="loading">Loading teachers...</div>
      ) : (
        <table className="teacher-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Faculty</th>
              <th>Department</th>
              <th>Working Days</th>
              <th>Working Hours</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teachers.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">No teachers found</td>
              </tr>
            ) : (
              teachers.map(teacher => (
                <tr key={teacher.id}>
                  <td>{teacher.name}</td>
                  <td>{teacher.email}</td>
                  <td>{teacher.faculty}</td>
                  <td>{teacher.department}</td>
                  <td>{teacher.working_days}</td>
                  <td>{teacher.working_hours}</td>
                  <td className="actions-cell">
                    <Link 
                      to={`/teachers/edit/${teacher.id}`} 
                      className="btn-edit"
                    >
                      Edit
                    </Link>
                    <button 
                      className="btn-delete" 
                      onClick={() => handleDeleteClick(teacher.id, teacher.name)}
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

export default TeacherList;
