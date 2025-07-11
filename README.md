# 🚗 Guest Parking App

A full-stack web app that allows condo residents to book guest parking spots for single days or entire weekends, with a clean admin interface, email confirmations, and AWS-powered infrastructure.

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
- Uses `react-hot-toast`, `clsx`, `tailwindcss`, and `react-datepicker`

### Features

✅ **NEW** Actually has a UI that's had a little bit of thought put into it!  
✅ **NEW** Services more than just weekends! Book spots for a single day all week OR for a full weekend at once. 
✅ View available spots dynamically  
✅ Email confirmations for users  
✅ Admin view with a calendar and booking list with delete functionality  
✅ CORS-safe, responsive, and toast-notified!

## 🛠️ Backend

- Built with [Express](https://expressjs.com/)
- Runs on [AWS Lambda](https://aws.amazon.com/lambda/)
- Uses [Supabase](https://supabase.com/) for PostgreSQL
- Email sending powered by [Resend](https://resend.com/)

### API Endpoints

| Method | Endpoint                     | Description                         |
|--------|------------------------------|-------------------------------------|
| GET    | `/api/bookings`              | Get all bookings (admin)            |
| GET    | `/api/bookings/availability` | Check available spots for a weekend |
| POST   | `/api/bookings`              | Create a new booking                |
| DELETE | `/api/bookings/:id`          | Delete a booking (admin only)       |

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
![Booking page ](screenshots/booking.png)

### Confirmation email
![Confirmation email](screenshots/email.png)

### Administration
![Administration](screenshots/admin.png)

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

