# 🚗 Guest Parking App

[![Demo](https://img.shields.io/badge/Demo-Live%20Site-ff00ff?style=for-the-badge)](https://main.db9w562prht4f.amplifyapp.com/)

[![Frontend](https://img.shields.io/badge/Frontend-React-blue?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![Backend](https://img.shields.io/badge/Backend-Express.js-green?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL-blue?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Infrastructure](https://img.shields.io/badge/Infrastructure-Terraform-orange?style=flat-square&logo=hashicorp&logoColor=white)](https://www.hashicorp.com/en/products/terraform)
[![Hosting](https://img.shields.io/badge/Hosting-Amplify_+_Lambda-yellow?style=flat-square)](https://aws.amazon.com)

A full-stack web app that allows condo residents to book guest parking spots for single days or entire weekends, with a clean admin interface, email confirmations, and AWS-powered infrastructure.

## 🌐 Live Demo

**Demo Site:** [https://main.db9w562prht4f.amplifyapp.com/](https://main.db9w562prht4f.amplifyapp.com/)

**Admin Access:** [https://main.db9w562prht4f.amplifyapp.com/admin](https://main.db9w562prht4f.amplifyapp.com/admin)  
**Admin Password:** `demo123`

> ⚠️ **Note:** The demo is running on Resend's free tier, so email confirmations will not be sent. All other functionality works normally.

## 📁 Project Structure

```
guest-parking/
├── frontend/      # Vite + React app (deployed to Amplify)
├── backend/       # Express API (deployed to AWS Lambda)
├── infra/         # Terraform IaC for backend infrastructure
├── screenshots/   # I mean I *hope* this folder is pretty self-explanatory
└── .github/       # GitHub Actions CI/CD workflows
```

## 🌐 Frontend

- Built with [Vite](https://vitejs.dev/) + [React](https://react.dev/)
- Deployed via [AWS Amplify](https://aws.amazon.com/amplify/)
- Uses `react-hot-toast`, `clsx`, `tailwindcss`, `react-datepicker`, `react-big-calendar`, and `@heroicons/react`

### Features

✅ **Modern UI** - Beautiful, responsive design with Tailwind CSS and Heroicons  
✅ **Flexible Booking** - Book spots for single days OR full weekends with a toggle  
✅ **Smart Calendar** - Interactive calendar picker for any date selection  
✅ **Dynamic Availability** - Real-time spot availability checking  
✅ **Admin Dashboard** - Modern calendar grid view with clickable events and grouped booking management  
✅ **Email Confirmations** - Automated booking confirmations via Resend  
✅ **Maintenance Mode** - Easy site maintenance with environment variable toggle  
✅ **Mobile Responsive** - Works perfectly on all devices  
✅ **Toast Notifications** - User-friendly feedback for all actions

## 🛠️ Backend

- Built with [Express](https://expressjs.com/)
- Runs on [AWS Lambda](https://aws.amazon.com/lambda/)
- Uses [Supabase](https://supabase.com/) for PostgreSQL
- Email sending powered by [Resend](https://resend.com/)

### Features

✅ **Flexible Bookings** - Supports both single-day and weekend batch bookings  
✅ **Database Reliability** - Includes connection retry logic for reliability  
✅ **Health Monitoring** - Health check endpoint for monitoring  
✅ **Input Validation** - Comprehensive validation with express-validator  
✅ **Rate Limiting** - Prevents abuse with configurable limits  
✅ **Security Headers** - Protection with Helmet middleware  
✅ **Input Sanitization** - XSS prevention and data cleaning  
✅ **Email Integration** - Automated confirmations via Resend

### API Endpoints

| Method | Endpoint                     | Description                         |
|--------|------------------------------|-------------------------------------|
| GET    | `/api/bookings`              | Get all bookings (admin)            |
| GET    | `/api/bookings/availability` | Check available spots for a date    |
| POST   | `/api/bookings`              | Create a single-day booking         |
| POST   | `/api/bookings/batch`        | Create multiple bookings (weekend)  |
| DELETE | `/api/bookings/:id`          | Delete a booking (admin only)       |
| GET    | `/api/bookings/ping`         | Health check endpoint               |
| GET    | `/api/bookings/test-email`   | Test email functionality (dev only) |

### Validation Rules

The API includes comprehensive input validation:

- **Date**: Must be valid ISO date, not in the past, max 6 months in advance
- **Spot Number**: Integer between 1-7
- **Names**: Letters, spaces, hyphens, apostrophes only (1-50 chars)
- **Unit Number**: Alphanumeric with hyphens (1-10 chars)
- **Email**: Valid email format, normalized
- **Guest Name**: Letters, spaces, hyphens, apostrophes only (1-100 chars)
- **Vehicle Type**: Letters, spaces, hyphens, apostrophes only (1-50 chars)
- **License Plate**: Uppercase letters, numbers, hyphens, spaces only (1-20 chars)

### Rate Limiting

- **Booking endpoints**: 5 requests per 15 minutes per IP
- **Admin endpoints**: 10 requests per 15 minutes per IP
- **Availability checks**: 30 requests per minute per IP

## 🗄️ Database Setup

You can use either a local PostgreSQL database for development or set up your remote (e.g., Supabase) database using the provided schema.

### Local Database Setup

1. **Install PostgreSQL**
   - macOS: `brew install postgresql && brew services start postgresql`
   - Windows/Linux: Download from [postgresql.org](https://www.postgresql.org/download/)

2. **Create the database and user:**
   ```bash
   psql postgres
   # In the psql prompt:
   CREATE DATABASE guest_parking_dev;
   CREATE USER guest_parking_user WITH PASSWORD 'devpassword';
   GRANT ALL PRIVILEGES ON DATABASE guest_parking_dev TO guest_parking_user;
   \q
   ```

3. **Apply the schema:**
   ```bash
   psql -U guest_parking_user -d guest_parking_dev -f infra/schema.sql
   ```

4. **(Optional) Seed the database with sample data:**
   ```bash
   psql -U guest_parking_user -d guest_parking_dev -f infra/seed.sql
   ```
   This will populate the `bookings` table with a few single-day and weekend bookings for testing/demo purposes.

5. **Configure your backend**
   In `backend/.env`, set:
     ```
     DATABASE_URL=postgresql://guest_parking_user:devpassword@localhost:5432/guest_parking_dev?sslmode=disable
     ```

6. **Run the backend**
   ```bash
   cd backend
   npm install
   node index.js
   ```

You can now use your local database for development. See the `infra/schema.sql` file for the database structure and `infra/seed.sql` for sample data.

### Remote (Supabase or Other) Database Setup

1. **Obtain your remote database connection string** from your provider (e.g., Supabase project settings).

2. **Apply the schema to your remote database:**
   ```bash
   psql "<your-remote-connection-string>" -f infra/schema.sql
   ```
   - Replace `<your-remote-connection-string>` with your actual connection string. For Supabase, you can find this in the project settings under Database > Connection string.
   - If your remote database requires SSL, ensure your connection string includes the appropriate SSL parameters (e.g., `?sslmode=require`).

3. **(Optional) Seed the remote database with sample data:**
   ```bash
   psql "<your-remote-connection-string>" -f infra/seed.sql
   ```

4. **Configure your backend**
   In `backend/.env`, set:
     ```
     DATABASE_URL=<your-remote-connection-string>
     ```

5. **Run the backend**
   ```bash
   cd backend
   npm install
   node index.js
   ```

Your backend will now use your remote database. See the `infra/schema.sql` file for the database structure and `infra/seed.sql` for sample data.

## ☁️ Infrastructure

- Managed with [Terraform](https://www.terraform.io/)
- Uses:
  - AWS Lambda for backend
  - AWS S3 for Lambda deployment package
  - Supabase PostgreSQL as the database

### Setup

```bash
cd infra
terraform init
terraform apply
```

⚠️ **Never commit secrets.** Use `terraform.tfvars.example` and `.env.example` as templates.

## 🚀 Deployments

### Frontend: Amplify

- Triggered on changes to `/frontend`
- Controlled by `amplify.yml` at the repo root

### Backend: GitHub Actions

- On push to `/backend`, deploys zip to AWS Lambda via `deploy-backend.yml`

## 🔐 Environment Variables

### Frontend

Set via Amplify (must use `VITE_` prefix):

```bash
VITE_REACT_APP_BACKEND_URL=https://<your-api-id>.execute-api.us-east-1.amazonaws.com
VITE_REACT_APP_ADMIN_PASSWORD=your_admin_password
```

### Backend

Handled via GitHub Actions & Terraform:

```bash
DATABASE_URL=postgresql://...
RESEND_API_KEY=re_XXXX
FROM_EMAIL=admin@example.com
ALLOWED_ORIGINS=https://main.<your-app>.amplifyapp.com
```

## 🛠️ Maintenance Mode

To temporarily take the site offline (e.g., for database migrations):

1. Set the environment variable `VITE_MAINTENANCE_MODE=true` in your Amplify (or frontend) environment.
2. Redeploy the frontend app.
3. To bring the site back online, set `VITE_MAINTENANCE_MODE=false` and redeploy again.

While in maintenance mode, users will see a full-page maintenance message and cannot interact with the app.

## 🕒 Supabase Keep-Alive

To prevent the free-tier Supabase database from pausing due to inactivity, a scheduled GitHub Actions workflow (`supabase-ping.yml`) runs every 3 days. This workflow calls the `/api/bookings/availability` endpoint with a valid weekend date, ensuring a real database query is executed and keeping the database awake.

- Workflow: `.github/workflows/supabase-ping.yml`
- Endpoint: `https://aso4mwrw90.execute-api.us-east-1.amazonaws.com/api/bookings/availability?weekend=YYYY-MM-DD`
- Adjust the schedule or endpoint as needed if the API changes.

## 📸 Screenshots

### Booking page
![Booking page ](screenshots/booking.png?v=2)

### Confirmation email
![Confirmation email](screenshots/email.png)

### Administration
![Administration](screenshots/admin.png?v=2)

## 🧪 Local Development

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
npm install
node index.js
```

## 🧪 Testing

This project includes comprehensive test suites for both frontend and backend with excellent coverage.

### Test Coverage Summary

| Component | Statements | Branches | Functions | Lines |
|-----------|------------|----------|-----------|-------|
| **Backend** | 80.44% | 67.64% | 85.18% | 80.81% |
| **Frontend** | 73.18% | 65.13% | 56.25% | 73.18% |

### Backend Tests

The backend includes comprehensive validation and API endpoint tests with mocked database and email services.

```bash
cd backend
npm test                    # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage report
npm run test:validation    # Run only validation tests
npm run test:api           # Run only API tests
```

#### Backend Test Coverage

- **API Endpoints**: All CRUD operations, validation, error handling
- **Validation Middleware**: Input sanitization, field validation, custom rules
- **Security Middleware**: CORS, rate limiting, request size limits
- **Database Operations**: Connection handling, transactions, error scenarios
- **Email Integration**: Mocked Resend email service

#### Test Types

- **Validation Tests**: Field validation, edge cases, error messages
- **API Tests**: Endpoint functionality, response codes, data integrity
- **Integration Tests**: Database operations, email sending
- **Error Handling**: Database failures, validation errors, rate limiting

### Frontend Tests

The frontend uses Vitest with React Testing Library for component and integration testing.

```bash
cd frontend
npm test                   # Run tests in watch mode
npm run test:run          # Run tests once
npm run test:coverage     # Run tests with coverage report
```

#### Frontend Test Coverage

- **Component Rendering**: All pages and UI components
- **Form Validation**: Required fields, error messages, user interactions
- **API Integration**: Mocked fetch calls, loading states, error handling
- **User Flows**: Complete booking process, admin authentication
- **Edge Cases**: Invalid inputs, network errors, disabled states

#### Test Types

- **Unit Tests**: Individual component functionality
- **Integration Tests**: Form submissions, API calls
- **User Interaction Tests**: Button clicks, form inputs, navigation
- **Error Handling**: Validation errors, network failures

### Test Features

✅ **Comprehensive Coverage**: Both frontend and backend have solid test coverage  
✅ **Mocked Dependencies**: Database, email service, and external APIs are mocked  
✅ **Error Scenarios**: Tests cover validation errors, network failures, and edge cases  
✅ **User Flows**: Complete end-to-end user interactions are tested  
✅ **Security Testing**: Input validation, rate limiting, and security headers  
✅ **Performance**: Tests run quickly with proper mocking and setup  

### Running Tests

**Quick Test Run:**
```bash
# Backend
cd backend && npm test

# Frontend  
cd frontend && npm run test:run
```

**With Coverage:**
```bash
# Backend
cd backend && npm run test:coverage

# Frontend
cd frontend && npm run test:coverage
```

**Watch Mode (Development):**
```bash
# Backend
cd backend && npm run test:watch

# Frontend
cd frontend && npm test
```

## 🤝 Contributing

1. Fork this repo
2. Create your feature branch (`git checkout -b feature/thing`)
3. Commit your changes (`git commit -am 'Add thing'`)
4. Push to the branch (`git push origin feature/thing`)
5. Create a new Pull Request

## ⚠️ Security Notes

If using Supabase:
- Enable Row Level Security (RLS)
- Restrict public access where possible
- NEVER commit your `.env` or secrets — use `.env.example` templates

## 📬 Contact

Built with ❤️, hot-reloading, and a _lot_ of `console.log()` commands by [Scott Kosman](https://scottkosman.com)  
Got questions or want to contribute? Open an issue or reach out!

