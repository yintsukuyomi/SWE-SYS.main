import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TeacherList from '../components/TeacherList';
import { AuthProvider } from '../contexts/AuthContext';

// Mock the fetch function
global.fetch = jest.fn();

const mockTeachers = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    faculty: 'Engineering',
    department: 'Computer Science',
    working_days: 'Monday,Tuesday',
    working_hours: '09:00-17:00'
  }
];

describe('TeacherList Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  const renderTeacherList = (isAdmin = true) => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <TeacherList isAdmin={isAdmin} />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  test('renders teacher list with admin privileges', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTeachers)
      })
    );

    renderTeacherList(true);

    // Check if the title is rendered
    expect(screen.getByText('Teachers')).toBeInTheDocument();

    // Check if the add button is rendered for admin
    expect(screen.getByText('Add Teacher')).toBeInTheDocument();

    // Wait for teachers to be loaded
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  test('renders teacher list without admin privileges', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTeachers)
      })
    );

    renderTeacherList(false);

    // Check if the title is rendered
    expect(screen.getByText('Teachers')).toBeInTheDocument();

    // Check if the add button is not rendered for non-admin
    expect(screen.queryByText('Add Teacher')).not.toBeInTheDocument();

    // Wait for teachers to be loaded
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  test('handles API error gracefully', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.reject(new Error('API Error'))
    );

    renderTeacherList(true);

    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Error loading teachers')).toBeInTheDocument();
    });
  });

  test('sorts teachers alphabetically', async () => {
    const unsortedTeachers = [
      { id: 2, name: 'Zack Smith', email: 'zack@example.com', faculty: 'Science', department: 'Physics' },
      { id: 1, name: 'Alice Brown', email: 'alice@example.com', faculty: 'Arts', department: 'History' }
    ];

    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(unsortedTeachers)
      })
    );

    renderTeacherList(true);

    // Wait for teachers to be loaded
    await waitFor(() => {
      const teacherNames = screen.getAllByTestId('teacher-name');
      expect(teacherNames[0]).toHaveTextContent('Alice Brown');
      expect(teacherNames[1]).toHaveTextContent('Zack Smith');
    });
  });
}); 