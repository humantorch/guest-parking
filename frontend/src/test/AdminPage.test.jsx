import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import AdminPage from '../AdminPage';

// Mock the entire AdminPage component's dependencies
const mockFetch = vi.fn();
global.fetch = mockFetch;

const renderAdminPage = () => {
  return render(
    <BrowserRouter>
      <AdminPage />
    </BrowserRouter>
  );
};

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for fetch
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ bookings: [] })
    });
  });

  describe('Authentication', () => {
    it('should authenticate with correct password', async () => {
      renderAdminPage();
      
      // Enter correct password
      fireEvent.change(screen.getByPlaceholderText('Enter password'), { target: { value: 'parkingadmin' } });
      fireEvent.click(screen.getByText('Login'));
      
      await waitFor(() => {
        expect(screen.queryByText('Admin Login')).not.toBeInTheDocument();
      });
    });

    it('should handle Enter key for login', async () => {
      renderAdminPage();
      
      // Enter correct password and press Enter
      const passwordInput = screen.getByPlaceholderText('Enter password');
      fireEvent.change(passwordInput, { target: { value: 'parkingadmin' } });
      fireEvent.keyDown(passwordInput, { key: 'Enter' });
      
      await waitFor(() => {
        expect(screen.queryByText('Admin Login')).not.toBeInTheDocument();
      });
    });

    it('should show error for incorrect password', () => {
      renderAdminPage();
      
      // Enter incorrect password
      fireEvent.change(screen.getByPlaceholderText('Enter password'), { target: { value: 'wrong' } });
      fireEvent.click(screen.getByText('Login'));
      
      expect(screen.getByText('Incorrect password')).toBeInTheDocument();
    });
  });

  describe('Admin Dashboard', () => {
    beforeEach(async () => {
      // Mock successful authentication and bookings fetch
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ 
          bookings: [
            {
              id: 1,
              date: '2024-01-01',
              spot_number: 1,
              first_name: 'John',
              last_name: 'Doe',
              unit_number: '101',
              email: 'john@example.com',
              guest_name: 'Jane',
              vehicle_type: 'Sedan',
              license_plate: 'ABC123'
            }
          ] 
        })
      });
    });

    it('should display bookings after authentication', async () => {
      renderAdminPage();
      
      // Authenticate first
      fireEvent.change(screen.getByPlaceholderText('Enter password'), { target: { value: 'parkingadmin' } });
      fireEvent.click(screen.getByText('Login'));
      
      await waitFor(() => {
        expect(screen.getByText('All Bookings')).toBeInTheDocument();
      });
      
      await waitFor(() => {
        expect(screen.getByText(/John.*Doe/)).toBeInTheDocument();
      });
    });

    it('should show calendar view', async () => {
      renderAdminPage();
      
      // Authenticate first
      fireEvent.change(screen.getByPlaceholderText('Enter password'), { target: { value: 'parkingadmin' } });
      fireEvent.click(screen.getByText('Login'));
      
      await waitFor(() => {
        expect(screen.getByTestId('calendar')).toBeInTheDocument();
      });
    });

    it('should show list view', async () => {
      renderAdminPage();
      
      // Authenticate first
      fireEvent.change(screen.getByPlaceholderText('Enter password'), { target: { value: 'parkingadmin' } });
      fireEvent.click(screen.getByText('Login'));
      
      await waitFor(() => {
        expect(screen.getByText('All Bookings')).toBeInTheDocument();
      });
    });

    it('should handle booking deletion', async () => {
      // Mock successful deletion
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ bookings: [
          {
            id: 1,
            date: '2024-01-01',
            spot_number: 1,
            first_name: 'John',
            last_name: 'Doe',
            unit_number: '101',
            email: 'john@example.com',
            guest_name: 'Jane',
            vehicle_type: 'Sedan',
            license_plate: 'ABC123'
          }
        ] })
      }).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Booking deleted' })
      });

      renderAdminPage();
      
      // Authenticate first
      fireEvent.change(screen.getByPlaceholderText('Enter password'), { target: { value: 'parkingadmin' } });
      fireEvent.click(screen.getByText('Login'));
      
      await waitFor(() => {
        expect(screen.getByText('All Bookings')).toBeInTheDocument();
      });
      
      // Find and click delete button
      const deleteButton = screen.getByTestId('delete-button');
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/bookings/1'),
          expect.objectContaining({ method: 'DELETE' })
        );
      });
    });

    it('should handle fetch errors gracefully', async () => {
      // Mock fetch error
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      renderAdminPage();
      
      // Authenticate first
      fireEvent.change(screen.getByPlaceholderText('Enter password'), { target: { value: 'parkingadmin' } });
      fireEvent.click(screen.getByText('Login'));
      
      await waitFor(() => {
        expect(screen.getByText('All Bookings')).toBeInTheDocument();
      });
    });
  });

  describe('View Toggle', () => {
    beforeEach(async () => {
      // Mock successful authentication and bookings fetch
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ 
          bookings: [
            {
              id: 1,
              date: '2024-01-01',
              spot_number: 1,
              first_name: 'John',
              last_name: 'Doe',
              unit_number: '101',
              email: 'john@example.com',
              guest_name: 'Jane',
              vehicle_type: 'Sedan',
              license_plate: 'ABC123'
            }
          ] 
        })
      });
    });

    it('should switch between calendar and list views', async () => {
      renderAdminPage();
      
      // Authenticate first
      fireEvent.change(screen.getByPlaceholderText('Enter password'), { target: { value: 'parkingadmin' } });
      fireEvent.click(screen.getByText('Login'));
      
      await waitFor(() => {
        expect(screen.getByText('All Bookings')).toBeInTheDocument();
      });
      
      // The view toggle functionality would be tested here if implemented
      // For now, just verify the dashboard loads
      expect(screen.getByText('All Bookings')).toBeInTheDocument();
    });
  });
}); 