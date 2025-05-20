


// main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'
import 'react-hot-toast/dist/index.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import GuestParkingBookingApp from './App.jsx';
import AdminPage from './AdminPage.jsx'; // new admin page component

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GuestParkingBookingApp />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
