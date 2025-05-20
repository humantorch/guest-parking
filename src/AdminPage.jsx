// AdminPage.jsx
import React, { useState, useEffect } from 'react';
import { Input } from './components/ui/input';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { format, addDays, parseISO } from 'date-fns';

function formatWeekendRange(dateStr) {
  const friday = parseISO(dateStr);
  const monday = addDays(friday, 3);
  return `${format(friday, 'MMM d')} – ${format(monday, 'MMM d, yyyy')}`;
}


const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'letmein';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password');
    }
  };

  useEffect(() => {
    if (!authenticated) return;
    const fetchBookings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/bookings`);
        const data = await res.json();
        if (res.ok) {
          setBookings(data.bookings || []);
        } else {
          console.error(data.error);
        }
      } catch (err) {
        console.error('Error fetching bookings:', err);
      }
    };
    fetchBookings();
  }, [authenticated]);

  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto p-4">
        <h1 className="text-xl font-bold mb-2">Admin Login</h1>
        <Input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-2"
        />
        <Button onClick={handleLogin}>Login</Button>
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">All Bookings</h1>
      {bookings.length === 0 ? (
        <p>No bookings found.</p>
      ) : (
        bookings.map((booking, idx) => (
          <Card key={idx} className="mb-4">
            <CardContent>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Weekend:</strong> {formatWeekendRange(booking.weekend_start)}
              </p>

              <Card key={idx} className="mb-4">
                <CardContent className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <strong>Spot:</strong> {booking.spot_number}
                  </p>
                  <p>
                    <strong>Resident:</strong> {booking.first_name} {booking.last_name} (Unit {booking.unit_number})
                  </p>
                  <p>
                    <strong>Email:</strong> {booking.email}
                  </p>
                  <p>
                    <strong>Guest:</strong> {booking.guest_name}
                  </p>
                  <p>
                    <strong>Vehicle:</strong> {booking.vehicle_type}
                  </p>
                  <p>
                    <strong>Plate:</strong> {booking.license_plate}
                  </p>
                </CardContent>
              </Card>

            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
