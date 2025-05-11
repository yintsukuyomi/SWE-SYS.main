import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CourseList from '../components/CourseList';
import { AuthProvider } from '../contexts/AuthContext';

// Mock the fetch function
global.fetch = jest.fn();

const mockCourses = [
  {
    id: 1,
    name: 'Introduction to Programming',
    code: 'CS101',
    teacher: {
      id: 1,
      name: 'John Doe'
    },
    faculty: 'Engineering',
    department: 'Computer Science',
    level: 'Bachelor',
    type: 'Core',
    semester: 'Fall',
    ects: 6,
    total_hours: 3,
    is_active: true,
    student_count: 25
  }
];

describe('CourseList Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  const renderCourseList = (isAdmin = true) => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <CourseList isAdmin={isAdmin} />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  test('renders course list with admin privileges', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockCourses)
      })
    );

    renderCourseList(true);

    // Check if the title is rendered
    expect(screen.getByText('Courses')).toBeInTheDocument();

    // Check if the add button is rendered for admin
    expect(screen.getByText('Add Course')).toBeInTheDocument();

    // Wait for courses to be loaded
    await waitFor(() => {
      expect(screen.getByText('Introduction to Programming')).toBeInTheDocument();
    });
  });

  test('renders course list without admin privileges', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockCourses)
      })
    );

    renderCourseList(false);

    // Check if the title is rendered
    expect(screen.getByText('Courses')).toBeInTheDocument();

    // Check if the add button is not rendered for non-admin
    expect(screen.queryByText('Add Course')).not.toBeInTheDocument();

    // Wait for courses to be loaded
    await waitFor(() => {
      expect(screen.getByText('Introduction to Programming')).toBeInTheDocument();
    });
  });

  test('handles API error gracefully', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.reject(new Error('API Error'))
    );

    renderCourseList(true);

    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Error loading courses')).toBeInTheDocument();
    });
  });

  test('sorts courses alphabetically', async () => {
    const unsortedCourses = [
      {
        id: 2,
        name: 'Web Development',
        code: 'CS201',
        teacher: { id: 2, name: 'Jane Smith' },
        faculty: 'Engineering',
        department: 'Computer Science',
        level: 'Bachelor',
        type: 'Elective',
        semester: 'Spring',
        ects: 4,
        total_hours: 2,
        is_active: true,
        student_count: 20
      },
      {
        id: 1,
        name: 'Advanced Mathematics',
        code: 'MATH101',
        teacher: { id: 1, name: 'John Doe' },
        faculty: 'Science',
        department: 'Mathematics',
        level: 'Bachelor',
        type: 'Core',
        semester: 'Fall',
        ects: 6,
        total_hours: 3,
        is_active: true,
        student_count: 30
      }
    ];

    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(unsortedCourses)
      })
    );

    renderCourseList(true);

    // Wait for courses to be loaded
    await waitFor(() => {
      const courseNames = screen.getAllByTestId('course-name');
      expect(courseNames[0]).toHaveTextContent('Advanced Mathematics');
      expect(courseNames[1]).toHaveTextContent('Web Development');
    });
  });

  test('filters courses by faculty', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockCourses)
      })
    );

    renderCourseList(true);

    // Wait for courses to be loaded
    await waitFor(() => {
      expect(screen.getByText('Introduction to Programming')).toBeInTheDocument();
    });

    // Select faculty filter
    const facultyFilter = screen.getByLabelText('Faculty');
    fireEvent.change(facultyFilter, { target: { value: 'Engineering' } });

    // Check if filtered courses are displayed
    expect(screen.getByText('Introduction to Programming')).toBeInTheDocument();
  });
}); 