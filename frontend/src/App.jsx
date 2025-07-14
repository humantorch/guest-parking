import React, { useEffect, useState } from 'react';
import { Card, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { isFriday, isSaturday, isSunday, startOfWeek, addDays, format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import toast, { Toaster } from 'react-hot-toast';
import { CalendarDaysIcon, UserIcon, TruckIcon, CheckIcon } from '@heroicons/react/24/outline';


const TOTAL_SPOTS = 7;
const API_BASE_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL;

export default function GuestParkingBookingApp() {
  const isMaintenance = import.meta.env.VITE_MAINTENANCE_MODE === 'true';

  if (isMaintenance) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <h1 className="text-3xl font-bold mb-4 text-indigo-700">🚧 Maintenance Mode</h1>
        <p className="text-lg text-gray-700">The site is temporarily offline for scheduled maintenance.<br />Please check back soon!</p>
      </div>
    );
  }

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookingType, setBookingType] = useState('single'); // 'single' or 'weekend'
  const [availableSpots, setAvailableSpots] = useState([1, 2, 3, 4, 5, 6, 7]); // Initialize with all spots available
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    unitNumber: '',
    email: '',
    guestName: '',
    vehicleType: '',
    licensePlate: '',
  });
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [message, setMessage] = useState('');
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const fetchAvailability = async (dateToCheck = selectedDate, bookingTypeToCheck = bookingType) => {
    setIsLoadingAvailability(true);
    try {
      if (
        bookingTypeToCheck === 'weekend' &&
        [5, 6, 0].includes(dateToCheck.getDay())
      ) {
        // Calculate Friday of the weekend
        let friday;
        if (isFriday(dateToCheck)) friday = dateToCheck;
        else if (isSaturday(dateToCheck)) friday = addDays(dateToCheck, -1);
        else if (isSunday(dateToCheck)) friday = addDays(dateToCheck, -2);
        const weekendDates = [friday, addDays(friday, 1), addDays(friday, 2)];

        // Fetch availability for all three days
        const spotSets = await Promise.all(
          weekendDates.map(async (d) => {
            const res = await fetch(
              `${API_BASE_URL}/api/bookings/availability?date=${format(d, 'yyyy-MM-dd')}`
            );
            const data = await res.json();
            return data.availableSpots || [];
          })
        );
        // Only include spots available on all three days
        const availableSpots = [1, 2, 3, 4, 5, 6, 7].filter((spot) =>
          spotSets.every((set) => set.includes(spot))
        );
        setAvailableSpots(availableSpots);
      } else {
        // Single day logic (as before)
        try {
          const res = await fetch(
            `${API_BASE_URL}/api/bookings/availability?date=${format(dateToCheck, 'yyyy-MM-dd')}`
          );
          const data = await res.json();
          if (res.ok) {
            setAvailableSpots(data.availableSpots || []);
          } else {
            setAvailableSpots([]);
          }
        } catch (err) {
          setAvailableSpots([]);
        }
      }
    } finally {
      setIsLoadingAvailability(false);
    }
  };

  useEffect(() => {
    fetchAvailability(selectedDate, bookingType);
  }, [selectedDate, bookingType]);

  // Clear selected spot if it's no longer available after availability updates
  useEffect(() => {
    if (selectedSpot && !availableSpots.includes(selectedSpot)) {
      setSelectedSpot(null);
    }
  }, [availableSpots, selectedSpot]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBookingTypeChange = (newType) => {
    setBookingType(newType);
  };

  const handleSubmit = async () => {
    if (!selectedSpot) {
      toast.error('Please select a spot.');
      return;
    }

    for (const key in formData) {
      if (!formData[key]) {
        toast.error('Please fill in all required fields.');
        return;
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    // Helper to build payload
    const buildPayload = (dateStr) => ({
      date: dateStr,
      spot_number: selectedSpot,
      first_name: formData.firstName,
      last_name: formData.lastName,
      unit_number: formData.unitNumber,
      email: formData.email,
      guest_name: formData.guestName,
      vehicle_type: formData.vehicleType,
      license_plate: formData.licensePlate,
    });

    const day = selectedDate.getDay();
    const isWeekendDay = [5, 6, 0].includes(day); // Fri=5, Sat=6, Sun=0
    let bookingDates = [selectedDate];
    if (bookingType === 'weekend' && isWeekendDay) {
      let friday;
      if (isFriday(selectedDate)) friday = selectedDate;
      else if (isSaturday(selectedDate)) friday = addDays(selectedDate, -1);
      else if (isSunday(selectedDate)) friday = addDays(selectedDate, -2);
      bookingDates = [friday, addDays(friday, 1), addDays(friday, 2)];
    }

    // Check all days for spot availability before submitting
    let unavailable = [];
    for (const d of bookingDates) {
      const res = await fetch(`${API_BASE_URL}/api/bookings/availability?date=${format(d, 'yyyy-MM-dd')}`);
      const data = await res.json();
      if (!data.availableSpots || !data.availableSpots.includes(selectedSpot)) {
        unavailable.push(format(d, 'yyyy-MM-dd'));
      }
    }
    if (unavailable.length > 0) {
      toast.error(`Spot not available on: ${unavailable.join(', ')}`);
      setIsSubmitting(false);
      return;
    }

    let allSuccess = true;
    if (bookingType === 'weekend' && isWeekendDay) {
      // Batch booking: send one request to /api/bookings/batch
      const payload = {
        dates: bookingDates.map(d => format(d, 'yyyy-MM-dd')),
        spot_number: selectedSpot,
        first_name: formData.firstName,
        last_name: formData.lastName,
        unit_number: formData.unitNumber,
        email: formData.email,
        guest_name: formData.guestName,
        vehicle_type: formData.vehicleType,
        license_plate: formData.licensePlate,
      };
      try {
        const res = await fetch(`${API_BASE_URL}/api/bookings/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          allSuccess = false;
          if (data.error === 'Validation failed' && Array.isArray(data.details)) {
            const messages = data.details.map(d => d.message).join('\n');
            toast.error(messages);
          } else {
            toast.error(data.error || 'Something went wrong.');
          }
        }
      } catch (err) {
        allSuccess = false;
        toast.error('Failed to connect to server.');
      }
    } else {
      // Single day booking: use existing endpoint
      const payload = buildPayload(format(selectedDate, 'yyyy-MM-dd'));
      try {
        const res = await fetch(`${API_BASE_URL}/api/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          allSuccess = false;
          if (data.error === 'Validation failed' && Array.isArray(data.details)) {
            const messages = data.details.map(d => d.message).join('\n');
            toast.error(messages);
          } else {
            toast.error(data.error || 'Something went wrong.');
          }
        }
      } catch (err) {
        allSuccess = false;
        toast.error('Failed to connect to server.');
      }
    }
    if (allSuccess) {
      setBookingConfirmed(true);
      setShowSuccessAnimation(true);
      toast.success(
        bookingType === 'weekend' && isWeekendDay
          ? 'Full weekend booking confirmed!'
          : 'Booking confirmed!'
      );
      setSelectedSpot(null);
      fetchAvailability();
      setFormData({
        firstName: '',
        lastName: '',
        unitNumber: '',
        email: '',
        guestName: '',
        vehicleType: '',
        licensePlate: '',
      });
      // Hide animation after 3 seconds
      setTimeout(() => setShowSuccessAnimation(false), 3000);
    }
    setIsSubmitting(false);
  };

  const renderWeekend = (date) => {
    const friday = addDays(startOfWeek(date, { weekStartsOn: 1 }), 4);
    const monday = addDays(friday, 3);
    return `${format(friday, 'MMM d')} - ${format(monday, 'MMM d, yyyy')}`;
  };

  // Calculate the correct weekend range for the selected date
  let weekendFriday = null;
  if (isFriday(selectedDate)) weekendFriday = selectedDate;
  else if (isSaturday(selectedDate)) weekendFriday = addDays(selectedDate, -1);
  else if (isSunday(selectedDate)) weekendFriday = addDays(selectedDate, -2);

  const weekendText =
    weekendFriday
      ? `Weekend: ${format(weekendFriday, 'MMM d')} - ${format(addDays(weekendFriday, 2), 'MMM d, yyyy')}`
      : 'Weekend: ';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex flex-col items-center justify-start py-8">
      <Toaster />
      {/* Hero Section */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-indigo-900 mb-2 flex items-center justify-center gap-2">
          <CalendarDaysIcon className="w-8 h-8 text-indigo-600 inline-block" />
          Book Guest Parking
        </h1>
        <p className="text-gray-600 max-w-xl mx-auto">Reserve a spot for your guest—quick, easy, and instant confirmation.</p>
      </div>
      {/* Card Layout */}
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-8 flex flex-col gap-8">
        {/* Date Section */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CalendarDaysIcon className="w-5 h-5 text-indigo-500" />
            <span className="font-semibold text-lg text-indigo-800">Select Date</span>
          </div>
          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            minDate={new Date()}
            dateFormat="yyyy-MM-dd"
            className="border p-2 rounded w-full focus:ring-2 focus:ring-indigo-300 bg-white"
            placeholderText="Select a date"
            dayClassName={(date) => {
              const day = date.getDay();
              if ([5, 6, 0].includes(day)) {
                return 'bg-blue-50 text-blue-700 font-semibold';
              }
              return '';
            }}
          />
          <div className="text-sm text-gray-600 mt-1">{weekendText}</div>
        </div>
        {/* Booking Type Toggle */}
        <div className="flex items-center gap-4">
          <span className="font-semibold text-indigo-800">Booking Type:</span>
          <div className={`flex gap-4 ${!(isFriday(selectedDate) || isSaturday(selectedDate) || isSunday(selectedDate)) ? 'opacity-50 pointer-events-none select-none' : ''}`}> 
            <label className="flex items-center gap-1">
              <input
                type="radio"
                value="single"
                checked={bookingType === 'single'}
                onChange={() => handleBookingTypeChange('single')}
                disabled={!(isFriday(selectedDate) || isSaturday(selectedDate) || isSunday(selectedDate))}
              />
              Only this day
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                value="weekend"
                checked={bookingType === 'weekend'}
                onChange={() => handleBookingTypeChange('weekend')}
                disabled={!(isFriday(selectedDate) || isSaturday(selectedDate) || isSunday(selectedDate))}
              />
              Full weekend (Fri–Sun)
            </label>
          </div>
        </div>
        <hr className="my-2 border-gray-200" />
        {/* Spot Selection Section */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TruckIcon className="w-5 h-5 text-indigo-500" />
            <span className="font-semibold text-lg text-indigo-800">Select Spot</span>
            {isLoadingAvailability && (
              <span className="text-sm text-gray-500 ml-2">Loading availability...</span>
            )}
          </div>
          <div className="flex flex-col gap-4">
            {/* P1 Group */}
            <div>
              <h3 className="font-semibold mb-2 text-gray-700">Level P1 (Spots 1–4)</h3>
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3, 4].map((spot) => {
                  const isAvailable = availableSpots.includes(spot);
                  const isSelected = selectedSpot === spot;
                  return (
                    <Button
                      key={spot}
                      variant={isSelected ? 'default' : 'outline'}
                      onClick={() => isAvailable && setSelectedSpot(spot)}
                      disabled={!isAvailable}
                      className={
                        `${isAvailable ? (isSelected ? 'bg-indigo-600 text-white border-2 border-indigo-700 shadow-lg shadow-[0_0_0_4px_rgba(99,102,241,0.3)]' : 'border-2 border-green-400 text-green-700 hover:bg-green-50 hover:shadow-md') : 'border-2 border-gray-300 text-gray-400 cursor-not-allowed'} ` +
                        `${isSelected ? 'ring-2 ring-indigo-400' : ''} px-4 py-2 rounded-lg font-semibold transition-all duration-200`
                      }
                    >
                      Spot {spot}
                    </Button>
                  );
                })}
              </div>
            </div>
            {/* P2 Group */}
            <div>
              <h3 className="font-semibold mb-2 text-gray-700">Level P2 (Spots 5–7)</h3>
              <div className="flex gap-2 flex-wrap">
                {[5, 6, 7].map((spot) => {
                  const isAvailable = availableSpots.includes(spot);
                  const isSelected = selectedSpot === spot;
                  return (
                    <Button
                      key={spot}
                      variant={isSelected ? 'default' : 'outline'}
                      onClick={() => isAvailable && setSelectedSpot(spot)}
                      disabled={!isAvailable}
                      className={
                        `${isAvailable ? (isSelected ? 'bg-indigo-600 text-white border-2 border-indigo-700 shadow-lg shadow-[0_0_0_4px_rgba(99,102,241,0.3)]' : 'border-2 border-green-400 text-green-700 hover:bg-green-50 hover:shadow-md') : 'border-2 border-gray-300 text-gray-400 cursor-not-allowed'} ` +
                        `${isSelected ? 'ring-2 ring-indigo-400' : ''} px-4 py-2 rounded-lg font-semibold transition-all duration-200`
                      }
                    >
                      Spot {spot}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <hr className="my-2 border-gray-200" />
        {/* Guest Info Section */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <UserIcon className="w-5 h-5 text-indigo-500" />
            <span className="font-semibold text-lg text-indigo-800">Guest Information</span>
          </div>
          <div className="mb-2 text-sm text-red-600 font-semibold flex items-center gap-1">
            <span className="text-red-500">⚠️</span>
            All fields are required.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleInputChange} />
            <Input name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleInputChange} />
            <Input name="unitNumber" placeholder="Unit Number" value={formData.unitNumber} onChange={handleInputChange} />
            <Input name="email" placeholder="Email" value={formData.email} onChange={handleInputChange} />
            <Input name="guestName" placeholder="Guest Name" value={formData.guestName} onChange={handleInputChange} />
            <Input name="vehicleType" placeholder="Vehicle Type" value={formData.vehicleType} onChange={handleInputChange} />
            <Input name="licensePlate" placeholder="License Plate" value={formData.licensePlate} onChange={handleInputChange} />
          </div>
        </div>
        <hr className="my-2 border-gray-200" />
        {/* Book Button */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`w-full py-3 text-lg font-bold rounded-xl shadow-md transition ${
            showSuccessAnimation 
              ? 'bg-green-600 hover:bg-green-700 animate-pulse' 
              : 'bg-indigo-600 hover:bg-indigo-700'
          } text-white`}
        >
          {isSubmitting ? 'Booking...' : showSuccessAnimation ? '✅ Booked!' : 'Book Spot'}
        </Button>
      </div>
      {/* Footer Attribution */}
      <footer className="w-full text-center text-xs text-gray-500 mt-8 mb-2 opacity-80">
        Built with ❤️ by <a href="https://scottkosman.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-700">Scott Kosman</a> · <a href="https://github.com/humantorch/guest-parking" target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-700">source code on github</a>
      </footer>
    </div>
  );
}
