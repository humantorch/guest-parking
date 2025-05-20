import React, { useEffect, useState } from 'react';
import { Card, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { format, addDays, startOfWeek } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';


const TOTAL_SPOTS = 7;
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

export default function GuestParkingBookingApp() {
  const [selectedWeekend, setSelectedWeekend] = useState(new Date());
  const [availableSpots, setAvailableSpots] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);
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

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/bookings/availability?weekend=${format(selectedWeekend, 'yyyy-MM-dd')}`);
        const data = await res.json();
        if (res.ok) {
          setAvailableSpots(data.availableSpots);
        } else {
          console.error('Error loading availability:', data.error);
          setAvailableSpots([]);
        }
      } catch (err) {
        console.error('Failed to fetch availability:', err);
        setAvailableSpots([]);
      }
    };
    fetchAvailability();
  }, [selectedWeekend]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!selectedSpot) {
      return alert('Please select a spot.');
    }

    // Check for empty fields
    for (const key in formData) {
      if (!formData[key]) {
        return alert('Please fill in all required fields.');
      }
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return alert('Please enter a valid email address.');
    }

    const payload = {
      weekend_start: format(selectedWeekend, 'yyyy-MM-dd'),
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
      const res = await fetch(`${API_BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setBookingConfirmed(true);
        setMessage(data.message || 'Booking confirmed!');
      } else {
        setMessage(data.error || 'Something went wrong.');
      }
    } catch (err) {
      console.error(err);
      setMessage('Failed to connect to server.');
    }
  };


  const renderWeekend = (date) => {
    const friday = addDays(startOfWeek(date, { weekStartsOn: 1 }), 4);
    const monday = addDays(friday, 3);
    return `${format(friday, 'MMM d')} - ${format(monday, 'MMM d, yyyy')}`;
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Guest Parking Booking</h1>
      <div className="mb-4">
        <label className="block font-medium mb-2">Select Weekend</label>
        <DatePicker
          selected={selectedWeekend}
          onChange={(date) => setSelectedWeekend(date)}
          filterDate={(date) => date.getDay() === 5} // only allow Fridays
          minDate={new Date()} // disable past dates
          dateFormat="yyyy-MM-dd"
          className="border p-2 rounded"
          placeholderText="Select a Friday"
        />
        <div className="text-sm text-gray-600 mt-1">Weekend: {renderWeekend(selectedWeekend)}</div>
      </div>

      <div className="mb-4">
        <label className="block font-medium mb-2">Available Spots</label>
        <div className="flex flex-col gap-4">
          {/* P1 Group */}
          <div>
            <h3 className="font-semibold mb-2">Level P1 (Spots 1–4)</h3>
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
                    className={!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}
                  >
                    Spot {spot}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* P2 Group */}
          <div>
            <h3 className="font-semibold mb-2">Level P2 (Spots 5–7)</h3>
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
                    className={!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}
                  >
                    Spot {spot}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

      </div>
      
      <hr></hr>
      <p className="text-sm text-red-600 font-medium flex items-center gap-1 mb-2">
        ⚠️ All fields are required.
      </p>


      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-medium" htmlFor="firstName">First Name</label>
          <Input required id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} />
        </div>
        <div>
          <label className="block mb-1 font-medium" htmlFor="lastName">Last Name</label>
          <Input required id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} />
        </div>
        <div>
          <label className="block mb-1 font-medium" htmlFor="unitNumber">Unit Number</label>
          <Input required id="unitNumber" name="unitNumber" value={formData.unitNumber} onChange={handleInputChange} />
        </div>
        <div>
          <label className="block mb-1 font-medium" htmlFor="email">Email</label>
          <Input
            required
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium" htmlFor="guestName">Guest Name</label>
          <Input required id="guestName" name="guestName" value={formData.guestName} onChange={handleInputChange} />
        </div>
        <div>
          <label className="block mb-1 font-medium" htmlFor="vehicleType">Vehicle Type</label>
          <Input required id="vehicleType" name="vehicleType" value={formData.vehicleType} onChange={handleInputChange} />
        </div>
        <div className="col-span-2">
          <label className="block mb-1 font-medium" htmlFor="licensePlate">License Plate</label>
          <Input required id="licensePlate" name="licensePlate" value={formData.licensePlate} onChange={handleInputChange} />
        </div>
      </div>


      <Button onClick={handleSubmit} className="w-full">Submit Booking</Button>

      {message && (
        <Card className="mt-6">
          <CardContent>
            <p className="text-blue-800">{message}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
