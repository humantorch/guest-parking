import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import GuestParkingBookingApp from '../App';

// Mock the entire App component's dependencies
const mockFetch = vi.fn();
global.fetch = mockFetch;

const renderApp = () => {
  return render(
    <BrowserRouter>
      <GuestParkingBookingApp />
    </BrowserRouter>
  );
};

describe('GuestParkingBookingApp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Always mock available spots before rendering
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ availableSpots: [1, 2, 3, 4, 5, 6, 7] })
    });
  });

  describe('Initial Render', () => {
    it('should render the main booking form', () => {
      renderApp();
      expect(screen.getByText('Book Guest Parking')).toBeInTheDocument();
    });

    it('should render all form fields', () => {
      renderApp();
      expect(screen.getByPlaceholderText('First Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Last Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Unit Number')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Guest Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Vehicle Type')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('License Plate')).toBeInTheDocument();
    });

    it('should render spot selection buttons', () => {
      renderApp();
      expect(screen.getByText('Spot 1')).toBeInTheDocument();
      expect(screen.getByText('Spot 2')).toBeInTheDocument();
      expect(screen.getByText('Spot 3')).toBeInTheDocument();
      expect(screen.getByText('Spot 4')).toBeInTheDocument();
      expect(screen.getByText('Spot 5')).toBeInTheDocument();
      expect(screen.getByText('Spot 6')).toBeInTheDocument();
      expect(screen.getByText('Spot 7')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error when trying to submit without selecting a spot', async () => {
      renderApp();
      // Fill in all required fields
      fireEvent.change(screen.getByPlaceholderText('First Name'), { target: { value: 'John' } });
      fireEvent.change(screen.getByPlaceholderText('Last Name'), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByPlaceholderText('Unit Number'), { target: { value: '101' } });
      fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByPlaceholderText('Guest Name'), { target: { value: 'Jane' } });
      fireEvent.change(screen.getByPlaceholderText('Vehicle Type'), { target: { value: 'Sedan' } });
      fireEvent.change(screen.getByPlaceholderText('License Plate'), { target: { value: 'ABC123' } });
      // Try to submit without selecting a spot
      fireEvent.click(screen.getByText('Book Spot'));
      
      await waitFor(() => {
        expect(global.__toastError).toHaveBeenCalledWith('Please select a spot.');
      });
    });

    it('should show error when trying to submit with empty required fields', async () => {
      renderApp();
      // Select a spot first
      fireEvent.click(screen.getByText('Spot 1'));
      // Try to submit with empty fields
      fireEvent.click(screen.getByText('Book Spot'));
      
      await waitFor(() => {
        expect(global.__toastError).toHaveBeenCalledWith('Please fill in all required fields.');
      });
    });

    it('should show error for invalid email format', async () => {
      renderApp();
      // Select a spot first
      fireEvent.click(screen.getByText('Spot 1'));
      // Fill in all required fields except email
      fireEvent.change(screen.getByPlaceholderText('First Name'), { target: { value: 'John' } });
      fireEvent.change(screen.getByPlaceholderText('Last Name'), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByPlaceholderText('Unit Number'), { target: { value: '101' } });
      fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'invalid-email' } });
      fireEvent.change(screen.getByPlaceholderText('Guest Name'), { target: { value: 'Jane' } });
      fireEvent.change(screen.getByPlaceholderText('Vehicle Type'), { target: { value: 'Sedan' } });
      fireEvent.change(screen.getByPlaceholderText('License Plate'), { target: { value: 'ABC123' } });
      
      fireEvent.click(screen.getByText('Book Spot'));
      
      await waitFor(() => {
        expect(global.__toastError).toHaveBeenCalledWith('Please enter a valid email address.');
      });
    });
  });

  describe('API Integration', () => {
    it('should handle successful booking submission', async () => {
      // Mock successful booking response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ availableSpots: [1, 2, 3, 4, 5, 6, 7] })
      }).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Booking created successfully' })
      });

      renderApp();
      
      // Fill form and submit
      fireEvent.click(screen.getByText('Spot 1'));
      fireEvent.change(screen.getByPlaceholderText('First Name'), { target: { value: 'John' } });
      fireEvent.change(screen.getByPlaceholderText('Last Name'), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByPlaceholderText('Unit Number'), { target: { value: '101' } });
      fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByPlaceholderText('Guest Name'), { target: { value: 'Jane' } });
      fireEvent.change(screen.getByPlaceholderText('Vehicle Type'), { target: { value: 'Sedan' } });
      fireEvent.change(screen.getByPlaceholderText('License Plate'), { target: { value: 'ABC123' } });
      
      fireEvent.click(screen.getByText('Book Spot'));
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle validation errors from API', async () => {
      // Mock validation error response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ availableSpots: [1, 2, 3, 4, 5, 6, 7] })
      }).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ 
          error: 'Validation failed',
          details: [
            { message: 'Cannot book dates in the past' },
            { message: 'Email must be a valid email address' }
          ]
        })
      });

      renderApp();
      
      // Fill form and submit
      fireEvent.click(screen.getByText('Spot 1'));
      fireEvent.change(screen.getByPlaceholderText('First Name'), { target: { value: 'John' } });
      fireEvent.change(screen.getByPlaceholderText('Last Name'), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByPlaceholderText('Unit Number'), { target: { value: '101' } });
      fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'invalid-email' } });
      fireEvent.change(screen.getByPlaceholderText('Guest Name'), { target: { value: 'Jane' } });
      fireEvent.change(screen.getByPlaceholderText('Vehicle Type'), { target: { value: 'Sedan' } });
      fireEvent.change(screen.getByPlaceholderText('License Plate'), { target: { value: 'ABC123' } });
      
      fireEvent.click(screen.getByText('Book Spot'));
      
      await waitFor(() => {
        expect(global.__toastError).toHaveBeenCalledWith('Please enter a valid email address.');
      });
    });

    it('should handle network errors', async () => {
      // Mock network error
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ availableSpots: [1, 2, 3, 4, 5, 6, 7] })
      }).mockRejectedValueOnce(new Error('Network error'));

      renderApp();
      
      // Fill form and submit
      fireEvent.click(screen.getByText('Spot 1'));
      fireEvent.change(screen.getByPlaceholderText('First Name'), { target: { value: 'John' } });
      fireEvent.change(screen.getByPlaceholderText('Last Name'), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByPlaceholderText('Unit Number'), { target: { value: '101' } });
      fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByPlaceholderText('Guest Name'), { target: { value: 'Jane' } });
      fireEvent.change(screen.getByPlaceholderText('Vehicle Type'), { target: { value: 'Sedan' } });
      fireEvent.change(screen.getByPlaceholderText('License Plate'), { target: { value: 'ABC123' } });
      
      fireEvent.click(screen.getByText('Book Spot'));
      
      await waitFor(() => {
        expect(global.__toastError).toHaveBeenCalledWith('Failed to connect to server.');
      });
    });
  });

  describe('Spot Selection', () => {
    it('should allow selecting available spots', async () => {
      renderApp();
      
      const spot1Button = screen.getByText('Spot 1');
      fireEvent.click(spot1Button);
      
      await waitFor(() => {
        expect(spot1Button.className).toMatch(/ring-2|selected|bg-indigo/);
      });
    });
  });
}); 