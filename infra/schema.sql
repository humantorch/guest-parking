create table public.bookings (
  id serial not null,
  weekend_start date not null,
  spot_number integer not null,
  first_name text null,
  last_name text null,
  unit_number text null,
  email text null,
  guest_name text null,
  vehicle_type text null,
  license_plate text null,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  constraint bookings_pkey primary key (id),
  constraint bookings_weekend_start_spot_number_key unique (weekend_start, spot_number)
) TABLESPACE pg_default;