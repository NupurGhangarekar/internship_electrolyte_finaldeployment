# Internship Onboarding and Management Portal

A production-minded full-stack portal for managing interns, onboarding tasks, internship documents, and role-based dashboards.

## Tech Stack

- Frontend: React.js, Vite, Tailwind CSS, React Router, Axios, Chart.js
- Backend: Node.js, Express.js, MongoDB, Mongoose
- Authentication: JWT with bcrypt password hashing
- File Uploads: Multer with local `uploads` storage
- Architecture: routes, controllers, models, middleware, services, validators, utilities

## Features

- Admin and intern login with JWT authentication
- Role-based protected API and UI routes
- Admin dashboard with total interns, active interns, pending tasks, completed tasks, and chart
- Intern dashboard with assigned tasks, completed tasks, pending tasks, and progress percentage
- Intern CRUD with search and pagination
- Task create/edit/delete for admins
- Task status updates and remarks for interns
- Intern restriction: cannot create/delete/assign/complete tasks
- Document upload, replace, delete, and download
- Local upload service designed so S3 or other cloud storage can replace the storage layer later
- Toast notifications, loading states, empty states, filters, sorting, responsive sidebar, dark mode
- Global error handling, validation middleware, standardized API responses
- Optional email notification hook when a task is assigned

## Folder Structure

```text
internship-onboarding-portal/
  backend/
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
      services/
      utils/
      validators/
    uploads/
  frontend/
    src/
      api/
      components/
      context/
      layouts/
      pages/
      utils/
```

## Environment Variables

Backend `backend/.env.example`:

```env
PORT=
MONGO_URI=
JWT_SECRET=
JWT_EXPIRES_IN=1d
CLIENT_URL=
ADMIN_NAME=
ADMIN_EMAIL=
ADMIN_PASSWORD=
UPLOAD_DIR=uploads
EMAIL_ENABLED=false
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

Frontend `frontend/.env.example`:

```env
VITE_API_URL=
```

## Deployment

Backend on Render:

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Set `PORT`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL`, and any optional email settings in Render.
- `MONGO_URI` must be a MongoDB Atlas connection string.
- `CLIENT_URL` must be the deployed Vercel frontend URL.

Frontend on Vercel:

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Set `VITE_API_URL` to the deployed Render backend URL.

Database on MongoDB Atlas:

- Create an Atlas cluster and database user.
- Add the Render outbound access policy required by your Atlas network settings.
- Store the Atlas connection string in Render as `MONGO_URI`.

## Local Development

1. Install dependencies:

```bash
npm run install:all
```

2. Create backend environment file:

```bash
cp backend/.env.example backend/.env
```

Fill every required value in `backend/.env`. Use a MongoDB Atlas URI for `MONGO_URI` and the frontend origin for `CLIENT_URL`.

3. Create frontend environment file:

```bash
cp frontend/.env.example frontend/.env
```

Fill `VITE_API_URL` with the backend API URL.

4. Seed demo data:

```bash
npm run seed
```

The admin account is created from `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`. The seed also creates sample intern accounts for development.

5. Run the app in two terminals:

```bash
npm run dev:backend
npm run dev:frontend
```

## API Endpoints

Authentication:

- `POST /login`
- `POST /logout`
- `GET /me`

Users:

- `GET /users`
- `POST /users`
- `GET /users/:id`
- `PUT /users/:id`
- `DELETE /users/:id`
- `PUT /users/me`

Tasks:

- `GET /tasks`
- `POST /tasks`
- `PUT /tasks/:id`
- `DELETE /tasks/:id`
- `GET /tasks/stats/dashboard`

Documents:

- `POST /documents/upload`
- `GET /documents/:internId`
- `DELETE /documents/:id`

## Storage Notes

Uploaded files are saved under `backend/uploads`. The storage concerns are isolated in `backend/src/services/storage.service.js`, so a future S3 implementation can keep the controllers unchanged by exposing compatible upload and remove methods.

## Production Checklist

- Replace `JWT_SECRET` with a long random value.
- Use MongoDB Atlas or a managed MongoDB instance.
- Set `CLIENT_URL` to the deployed frontend origin.
- Set `VITE_API_URL` to the deployed backend API URL.
- Put the API behind HTTPS.
- Consider adding refresh tokens or token revocation for stricter logout semantics.
- Enable `EMAIL_ENABLED=true` and configure SMTP for task assignment emails.
- Replace local storage with S3 or similar for durable document storage.
