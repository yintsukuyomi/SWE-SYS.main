import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FACULTIES, getDepartmentsByFaculty } from '../constants/facultiesAndDepartments';
import { getCourses } from '../api';
import '../styles/ProgramList.css';

const LEVELS = [
  { id: 'prep', name: 'Preparatory Year', icon: '🔍' },
  { id: 'year1', name: 'Year 1', icon: '1️⃣' },
  { id: 'year2', name: 'Year 2', icon: '2️⃣' },
  { id: 'year3', name: 'Year 3', icon: '3️⃣' },
  { id: 'year4', name: 'Year 4', icon: '4️⃣' },
  { id: 'graduate', name: 'Graduate', icon: '🎓' },
  { id: 'phd', name: 'PhD', icon: '🔬' }
];

// Map string level values to IDs
const getLevelId = (levelString) => {
  if (levelString.includes('Preparatory')) return 'prep';
  if (levelString.includes('Year 1')) return 'year1';
  if (levelString.includes('Year 2')) return 'year2';
  if (levelString.includes('Year 3')) return 'year3';
  if (levelString.includes('Year 4')) return 'year4';
  if (levelString.includes('Graduate')) return 'graduate';
  if (levelString.includes('PhD')) return 'phd';
  return 'year1';  // Default to year 1
};

const ProgramList = ({ token }) => {
  const { facultyId, departmentId } = useParams();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const faculty = FACULTIES.find(f => f.id === facultyId);
  const departments = getDepartmentsByFaculty(facultyId);
  const department = departments.find(d => d.id === departmentId);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const allCourses = await getCourses(token);
        
        // Filter courses by faculty and department
        const facultyName = faculty ? faculty.name : '';
        const departmentName = department ? department.name : '';
        
        const filteredCourses = allCourses.filter(course => 
          course.faculty === facultyName && course.department === departmentName
        );
        
        setCourses(filteredCourses);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setError('Failed to load courses. Please try again.');
        setLoading(false);
      }
    };

    if (faculty && department) {
      fetchCourses();
    } else {
      setLoading(false);
      setError('Invalid faculty or department');
    }
  }, [token, faculty, department]);

  if (!faculty || !department) {
    return (
      <div className="program-list-container">
        <div className="error-message">Faculty or department not found</div>
        <Link to="/faculties" className="back-link">Back to Faculties</Link>
      </div>
    );
  }

  // Group courses by level
  const coursesByLevel = {};
  
  LEVELS.forEach(level => {
    coursesByLevel[level.id] = courses.filter(course => getLevelId(course.level) === level.id);
  });

  return (
    <div className="program-list-container">
      <div className="program-header">
        <div className="navigation-breadcrumb">
          <Link to="/faculties" className="breadcrumb-link">Faculties</Link> &gt; 
          <Link to={`/faculties/${facultyId}`} className="breadcrumb-link">{faculty.name}</Link> &gt; 
          <span className="current-page">{department.name}</span>
        </div>
        
        <h1>{department.name}</h1>
        <p className="program-subtitle">Programs and courses organized by academic year</p>
      </div>
      
      {loading ? (
        <div className="loading">Loading programs...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="level-sections">
          {LEVELS.map(level => {
            const levelCourses = coursesByLevel[level.id] || [];
            
            // Only show levels that have courses
            if (levelCourses.length === 0) return null;
            
            return (
              <div className="level-section" key={level.id}>
                <h2 className="level-title">
                  <span className="level-icon">{level.icon}</span>
                  {level.name}
                </h2>
                
                <div className="program-grid">
                  {levelCourses.map(course => (
                    <div className="program-card" key={course.id}>
                      <div className="program-code">{course.code}</div>
                      <h3 className="program-name">{course.name}</h3>
                      <div className="program-details">
                        <div className="program-detail">
                          <span className="detail-label">ECTS:</span> 
                          <span className="detail-value">{course.ects}</span>
                        </div>
                        <div className="program-detail">
                          <span className="detail-label">Type:</span> 
                          <span className="detail-value">{course.type}</span>
                        </div>
                        <div className="program-detail">
                          <span className="detail-label">Students:</span> 
                          <span className="detail-value">{course.student_count || 0}</span>
                        </div>
                      </div>
                      <Link to={`/courses/edit/${course.id}`} className="program-link">
                        View Details
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          
          {Object.values(coursesByLevel).every(courses => courses.length === 0) && (
            <div className="no-programs">
              <p>No programs found for this department.</p>
              <Link to="/courses/new" className="add-course-link">Add New Course</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgramList;
