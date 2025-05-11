import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ClassroomList from '../components/ClassroomList';
import { AuthProvider } from '../contexts/AuthContext';

// Mock the fetch function
global.fetch = jest.fn();

const mockClassrooms = [
  {
    id: 1,
    name: 'Room 101',
    capacity: 30,
    type: 'Lecture',
    faculty: 'Engineering',
    department: 'Computer Science'
  }
];

describe('ClassroomList Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  const renderClassroomList = (isAdmin = true) => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <ClassroomList isAdmin={isAdmin} />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  test('renders classroom list with admin privileges', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockClassrooms)
      })
    );

    renderClassroomList(true);

    // Check if the title is rendered
    expect(screen.getByText('Classrooms')).toBeInTheDocument();

    // Check if the add button is rendered for admin
    expect(screen.getByText('Add Classroom')).toBeInTheDocument();

    // Wait for classrooms to be loaded
    await waitFor(() => {
      expect(screen.getByText('Room 101')).toBeInTheDocument();
    });
  });

  test('renders classroom list without admin privileges', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockClassrooms)
      })
    );

    renderClassroomList(false);

    // Check if the title is rendered
    expect(screen.getByText('Classrooms')).toBeInTheDocument();

    // Check if the add button is not rendered for non-admin
    expect(screen.queryByText('Add Classroom')).not.toBeInTheDocument();

    // Wait for classrooms to be loaded
    await waitFor(() => {
      expect(screen.getByText('Room 101')).toBeInTheDocument();
    });
  });

  test('handles API error gracefully', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.reject(new Error('API Error'))
    );

    renderClassroomList(true);

    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Error loading classrooms')).toBeInTheDocument();
    });
  });

  test('sorts classrooms alphabetically', async () => {
    const unsortedClassrooms = [
      {
        id: 2,
        name: 'Room 202',
        capacity: 40,
        type: 'Laboratory',
        faculty: 'Science',
        department: 'Physics'
      },
      {
        id: 1,
        name: 'Room 101',
        capacity: 30,
        type: 'Lecture',
        faculty: 'Engineering',
        department: 'Computer Science'
      }
    ];

    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(unsortedClassrooms)
      })
    );

    renderClassroomList(true);

    // Wait for classrooms to be loaded
    await waitFor(() => {
      const classroomNames = screen.getAllByTestId('classroom-name');
      expect(classroomNames[0]).toHaveTextContent('Room 101');
      expect(classroomNames[1]).toHaveTextContent('Room 202');
    });
  });

  test('filters classrooms by type', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockClassrooms)
      })
    );

    renderClassroomList(true);

    // Wait for classrooms to be loaded
    await waitFor(() => {
      expect(screen.getByText('Room 101')).toBeInTheDocument();
    });

    // Select type filter
    const typeFilter = screen.getByLabelText('Type');
    fireEvent.change(typeFilter, { target: { value: 'Lecture' } });

    // Check if filtered classrooms are displayed
    expect(screen.getByText('Room 101')).toBeInTheDocument();
  });

  test('displays classroom capacity correctly', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockClassrooms)
      })
    );

    renderClassroomList(true);

    // Wait for classrooms to be loaded
    await waitFor(() => {
      expect(screen.getByText('30 seats')).toBeInTheDocument();
    });
  });
}); 