import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getClassrooms, deleteClassroom } from "../api";
import "../styles/ClassroomList.css";

const ClassroomList = ({ token }) => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    classroomId: null,
    classroomName: ''
  });

  useEffect(() => {
    fetchClassrooms();
  }, [token]);

  const fetchClassrooms = async () => {
    try {
      const data = await getClassrooms(token);
      setClassrooms(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching classrooms:", error);
      setError("Failed to load classrooms");
      setLoading(false);
    }
  };

  const handleDeleteClick = (id, name) => {
    setDeleteConfirm({
      show: true,
      classroomId: id,
      classroomName: name
    });
  };

  const cancelDelete = () => {
    setDeleteConfirm({
      show: false,
      classroomId: null,
      classroomName: ''
    });
  };

  const confirmDelete = async () => {
    try {
      await deleteClassroom(deleteConfirm.classroomId, token);
      setDeleteConfirm({
        show: false,
        classroomId: null,
        classroomName: ''
      });
      // Derslik listesini yeniden yükle
      fetchClassrooms();
    } catch (error) {
      console.error("Error deleting classroom:", error);
      setError("Failed to delete classroom. " + (error.detail || ""));
    }
  };

  return (
    <div className="classroom-list-container">
      <div className="classroom-header">
        <h1>Classrooms</h1>
        <Link to="/classrooms/new" className="add-classroom-btn">
          <span className="btn-icon">+</span> Add New Classroom
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
              <p>Are you sure you want to delete <strong>{deleteConfirm.classroomName}</strong>?</p>
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
        <div className="loading">Loading classrooms...</div>
      ) : (
        <table className="classroom-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Capacity</th>
              <th>Type</th>
              <th>Faculty</th>
              <th>Department</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {classrooms.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">No classrooms found</td>
              </tr>
            ) : (
              classrooms.map(classroom => (
                <tr key={classroom.id}>
                  <td>{classroom.name}</td>
                  <td>{classroom.capacity}</td>
                  <td>{classroom.type}</td>
                  <td>{classroom.faculty}</td>
                  <td>{classroom.department}</td>
                  <td className="actions-cell">
                    <Link 
                      to={`/classrooms/edit/${classroom.id}`} 
                      className="btn-edit"
                    >
                      Edit
                    </Link>
                    <button 
                      className="btn-delete" 
                      onClick={() => handleDeleteClick(classroom.id, classroom.name)}
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

export default ClassroomList;
