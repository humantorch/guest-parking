-- Reset the bookings table
TRUNCATE TABLE bookings RESTART IDENTITY CASCADE;

-- Single-day bookings
INSERT INTO bookings (date, spot_number, first_name, last_name, unit_number, email, guest_name, vehicle_type, license_plate)
VALUES
  ('2025-08-09', 1, 'Alice', 'Smith', '101', 'alice@example.com', 'Bob', 'Sedan', 'ABC123'),
  ('2025-08-10', 2, 'Carol', 'Jones', '202', 'carol@example.com', 'Dave', 'SUV', 'XYZ789');

-- Weekend booking for spot 3 (Fri, Sat, Sun)
INSERT INTO bookings (date, spot_number, first_name, last_name, unit_number, email, guest_name, vehicle_type, license_plate)
VALUES
  ('2025-08-16', 3, 'Eve', 'Brown', '303', 'eve@example.com', 'Frank', 'Truck', 'LMN456'),
  ('2025-08-17', 3, 'Eve', 'Brown', '303', 'eve@example.com', 'Frank', 'Truck', 'LMN456'),
  ('2025-08-18', 3, 'Eve', 'Brown', '303', 'eve@example.com', 'Frank', 'Truck', 'LMN456');

-- Weekend booking for spot 4 (Fri, Sat, Sun)
INSERT INTO bookings (date, spot_number, first_name, last_name, unit_number, email, guest_name, vehicle_type, license_plate)
VALUES
  ('2025-08-16', 4, 'Grace', 'Lee', '404', 'grace@example.com', 'Heidi', 'Coupe', 'QRS321'),
  ('2025-08-17', 4, 'Grace', 'Lee', '404', 'grace@example.com', 'Heidi', 'Coupe', 'QRS321'),
  ('2025-08-18', 4, 'Grace', 'Lee', '404', 'grace@example.com', 'Heidi', 'Coupe', 'QRS321'); 