import React, { useState, useEffect, useRef } from 'react';
import { Input } from './components/ui/input';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { format, addDays, parseISO, isBefore, startOfToday } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';
import clsx from 'clsx';

const ADMIN_PASSWORD = import.meta.env.VITE_REACT_APP_ADMIN_PASSWORD;
const API_BASE_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL;

function formatWeekendRange(dateStr) {
  const friday = parseISO(dateStr);
  const monday = addDays(friday, 3);
  return `${format(friday, 'MMM d')} – ${format(monday, 'MMM d, yyyy')}`;
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const [highlightedId, setHighlightedId] = useState(null);
  const [showPast, setShowPast] = useState(false);
  const cardRefs = useRef({});

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

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

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this booking?');
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Booking deleted');
        setBookings((prev) => prev.filter((b) => b.id !== id));
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Failed to delete booking');
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Error deleting booking');
    }
  };

  const scrollToBooking = (id) => {
    const el = cardRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedId(id);
      setTimeout(() => setHighlightedId(null), 2000);
    }
  };

  useEffect(() => {
    if (authenticated) fetchBookings();
  }, [authenticated]);

  const grouped = bookings.reduce((acc, b) => {
    acc[b.weekend_start] = acc[b.weekend_start] || [];
    acc[b.weekend_start].push(b);
    return acc;
  }, {});

  const sortedWeekends = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

  const today = startOfToday();

  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto p-4">
        <h1 className="text-xl font-bold mb-2">Admin Login</h1>
        <Input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          className="mb-2"
        />
        <Button onClick={handleLogin}>Login</Button>
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <Toaster position="top-center" />
      <h1 className="text-2xl font-bold mb-4">All Bookings</h1>

      {/* Calendar View */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">📅 Calendar View</h2>
        <div className="flex flex-col gap-2">
          {sortedWeekends.map((weekend) => {
            const isPast = isBefore(parseISO(weekend), today);
            if (isPast && !showPast) return null;

            return (
              <div key={weekend} className="bg-gray-100 p-3 rounded">
                <h3 className="font-semibold">{formatWeekendRange(weekend)}</h3>
                <div className="flex gap-2 flex-wrap mt-2">
                  {grouped[weekend].map((b) => (
                    <button
                      key={b.id}
                      onClick={() => scrollToBooking(b.id)}
                      className={clsx(
                        'text-sm px-2 py-1 border rounded hover:bg-blue-100 transition',
                        // { 'opacity-60 cursor-not-allowed': isPast }
                      )}
                      // disabled={isPast}
                    >
                      Spot {b.spot_number}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {!showPast && (
          <button
            className="text-sm mt-3 underline text-blue-600 hover:text-blue-800"
            onClick={() => setShowPast(true)}
          >
            See past bookings
          </button>
        )}
      </div>

      {/* Booking List */}
      {sortedWeekends.map((weekend) => {
        const isPast = isBefore(parseISO(weekend), today);
        if (isPast && !showPast) return null;

        return (
          <div key={weekend} className="mb-8">
            <h2 className="text-lg font-semibold mb-2">{formatWeekendRange(weekend)}</h2>
            {grouped[weekend].map((booking) => (
              <Card
                key={booking.id}
                ref={(el) => (cardRefs.current[booking.id] = el)}
                className={clsx(
                  'mb-4 transition-colors duration-500',
                  highlightedId === booking.id ? 'bg-blue-100' : 'bg-white'
                )}
              >
                <CardContent className="space-y-2 py-4">
                  <p>
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
                  <Button
                    variant="destructive"
                    disabled={isPast}
                    onClick={() => handleDelete(booking.id)}
                  >
                    Delete Booking
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      })}
    </div>
  );
}
