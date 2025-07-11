import React, { useState, useEffect, useRef } from 'react';
import { Input } from './components/ui/input';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { format, addDays, parseISO, isBefore, startOfToday, isFriday, isSaturday, isSunday } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';
import clsx from 'clsx';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { parse, startOfWeek, getDay, format as formatFns } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { CalendarDaysIcon, UserIcon, TruckIcon } from '@heroicons/react/24/outline';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format: formatFns,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const ADMIN_PASSWORD = import.meta.env.VITE_REACT_APP_ADMIN_PASSWORD;
const API_BASE_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL;

// Helper to get the Friday of the weekend for a given date
function getWeekendFriday(dateStr) {
  const date = parseISO(dateStr);
  if (isFriday(date)) return format(date, 'yyyy-MM-dd');
  if (isSaturday(date)) return format(addDays(date, -1), 'yyyy-MM-dd');
  if (isSunday(date)) return format(addDays(date, -2), 'yyyy-MM-dd');
  // For non-weekend bookings, just use the date itself
  return format(date, 'yyyy-MM-dd');
}

function formatWeekendRange(fridayStr) {
  const friday = parseISO(fridayStr);
  const sunday = addDays(friday, 2);
  return `${format(friday, 'MMM d')} – ${format(sunday, 'MMM d, yyyy')}`;
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

  const handleDeleteGroup = async (ids) => {
    const confirmed = window.confirm('Are you sure you want to delete this booking' + (ids.length > 1 ? ' (all days)?' : '?'));
    if (!confirmed) return;
    try {
      for (const id of ids) {
        const res = await fetch(`${API_BASE_URL}/api/bookings/${id}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          const errData = await res.json();
          toast.error(errData.error || 'Failed to delete booking');
        }
      }
      toast.success('Booking(s) deleted');
      setBookings((prev) => prev.filter((b) => !ids.includes(b.id)));
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Error deleting booking(s)');
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

  // Transform bookings into calendar events
  const events = bookings.map(b => ({
    id: b.id,
    title: `Spot ${b.spot_number} - ${b.guest_name || 'No guest'}`,
    start: new Date(b.date),
    end: new Date(b.date),
    allDay: true,
    resource: b,
  }));

  const today = startOfToday();

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex flex-col items-center justify-start py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-indigo-900 mb-2 flex items-center justify-center gap-2">
            <CalendarDaysIcon className="w-8 h-8 text-indigo-600 inline-block" />
            Admin Login
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto">Enter the admin password to view and manage all bookings.</p>
        </div>
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 flex flex-col gap-6">
          <Input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            className="mb-2"
          />
          <Button onClick={handleLogin} className="w-full py-3 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition">Login</Button>
          {error && <p className="text-red-600 mt-2">{error}</p>}
        </div>
      </div>
    );
  }

  // Group bookings by weekend Friday, spot, and guest (using guest_name, email, and resident name for uniqueness)
  const groupedBookings = Object.values(
    bookings.reduce((acc, b) => {
      const friday = getWeekendFriday(b.date);
      const groupKey = [
        friday,
        b.spot_number,
        b.guest_name || '',
        b.email || '',
        b.first_name || '',
        b.last_name || ''
      ].join('|');
      if (!acc[groupKey]) {
        acc[groupKey] = {
          friday,
          spot_number: b.spot_number,
          first_name: b.first_name,
          last_name: b.last_name,
          unit_number: b.unit_number,
          email: b.email,
          guest_name: b.guest_name,
          vehicle_type: b.vehicle_type,
          license_plate: b.license_plate,
          bookingIds: [b.id],
          dates: [b.date],
        };
      } else {
        acc[groupKey].bookingIds.push(b.id);
        acc[groupKey].dates.push(b.date);
      }
      return acc;
    }, {})
  ).sort((a, b) => new Date(b.friday) - new Date(a.friday));

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex flex-col items-center justify-start py-8">
      <Toaster position="top-center" />
      {/* Hero Section */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-indigo-900 mb-2 flex items-center justify-center gap-2">
          <CalendarDaysIcon className="w-8 h-8 text-indigo-600 inline-block" />
          All Bookings
        </h1>
        <p className="text-gray-600 max-w-xl mx-auto">View, search, and manage all guest parking bookings.</p>
      </div>
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl p-8 flex flex-col gap-8">
        {/* Modern Calendar Grid View */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDaysIcon className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-semibold text-indigo-800">Calendar View</h2>
          </div>
          <div style={{ height: 600 }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 600 }}
              onSelectEvent={event => {
                const b = event.resource;
                scrollToBooking(b.id);
              }}
              eventPropGetter={() => ({ className: 'admin-small-calendar-event' })}
              views={['month', 'agenda']}
              messages={{ agenda: 'List' }}
            />
          </div>
        </div>
        {/* Booking List */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TruckIcon className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-semibold text-indigo-800">Booking List</h2>
          </div>
          {groupedBookings.map((group) => (
            <Card
              key={group.friday + '|' + group.spot_number + '|' + group.guest_name + '|' + group.email}
              ref={(el) => {
                // Attach all bookingIds in this group to the same ref for scrollToBooking
                group.bookingIds.forEach(id => { cardRefs.current[id] = el; });
              }}
              className={clsx(
                'mb-4 transition-colors duration-500',
                group.bookingIds.some(id => highlightedId === id) ? 'bg-blue-100' : 'bg-white',
                'rounded-2xl shadow-md p-6'
              )}
            >
              <CardContent className="space-y-2 py-4">
                {group.dates.length > 1 ? (
                  <>
                    <p>
                      <strong>Weekend:</strong> {formatWeekendRange(group.friday)}
                    </p>
                    <p>
                      <strong>Booked Dates:</strong> {group.dates
                        .map(d => format(parseISO(d), 'EEE, MMM d'))
                        .sort((a, b) => new Date(a) - new Date(b))
                        .join(', ')}
                    </p>
                    <div className="mt-6">
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteGroup(group.bookingIds)}
                        className="w-full py-2 text-base font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md transition"
                      >
                        Delete Full Weekend Booking
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p>
                      <strong>Date:</strong> {format(parseISO(group.dates[0]), 'MMM d, yyyy')}
                    </p>
                    <div className="mt-6">
                      <Button
                        variant="destructive"
                        disabled={isBefore(parseISO(group.dates[0]), today)}
                        onClick={() => handleDeleteGroup(group.bookingIds)}
                        className="w-full py-2 text-base font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md transition"
                      >
                        Delete
                      </Button>
                    </div>
                  </>
                )}
                <hr className="my-2 border-gray-200" />
                <p>
                  <strong>Spot:</strong> <span className="inline-block px-2 py-1 rounded-lg font-semibold border border-green-400 text-green-700 bg-green-50">{group.spot_number}</span>
                </p>
                <p>
                  <strong>Resident:</strong> {group.first_name} {group.last_name} (Unit {group.unit_number})
                </p>
                <p>
                  <strong>Email:</strong> {group.email}
                </p>
                <p>
                  <strong>Guest:</strong> {group.guest_name}
                </p>
                <p>
                  <strong>Vehicle:</strong> {group.vehicle_type}
                </p>
                <p>
                  <strong>Plate:</strong> {group.license_plate}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <style>{`
        .admin-small-calendar-event, .rbc-event {
          font-size: 0.8rem !important;
          padding: 2px 4px;
        }
        .rbc-agenda-view .rbc-agenda-table thead {
          display: none !important;
        }
        .rbc-agenda-view .rbc-agenda-time-cell,
        .rbc-agenda-view th.rbc-header:first-child {
          display: none !important;
        }
        .rbc-agenda-view .rbc-agenda-event-cell {
          transition: background-color 0.18s ease;
        }
        .rbc-agenda-view .rbc-agenda-table tbody tr:hover .rbc-agenda-event-cell {
          background-color: #e0e7ff !important;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}