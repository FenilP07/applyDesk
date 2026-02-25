# ApplyDesk

ApplyDesk is a full-stack web application with a Node.js/Express backend and a React/Vite frontend. It provides job automation, notifications, and user management features.

---

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Scripts](#scripts)
- [License](#license)

---

## Features
- User authentication and authorization
- Job automation and management
- Notification system
- Protected and public routes
- Responsive UI

## Tech Stack
- **Backend:** Node.js, Express.js
- **Frontend:** React, Vite
- **Database:** (Configure in `backend/configs/db.config.js`)

## Project Structure
```
backend/
  app.js, index.js, package.json
  configs/         # Database and app configs
  controllers/     # Route controllers
  middlewares/     # Express middlewares
  models/          # Mongoose models
  routes/          # Express routes
  utils/           # Utility functions
frontend/
  src/
    api/           # API clients
    components/    # React components
    modals/        # Modal components
    pages/         # Page components
    store/         # State management
  public/          # Static assets
  App.jsx, main.jsx, ...
  package.json, vite.config.js
```

## Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- npm or yarn

---

## Backend Setup
1. Navigate to the backend folder:
   ```sh
   cd backend
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Configure your database in `configs/db.config.js`.
4. Start the backend server:
   ```sh
   npm start
   ```
   The backend will run on the port specified in your config (default: 3000).

---

## Frontend Setup
1. Navigate to the frontend folder:
   ```sh
   cd frontend
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the development server:
   ```sh
   npm run dev
   ```
   The frontend will run on [http://localhost:5173](http://localhost:5173) by default.

---

## Scripts
### Backend
- `npm start` — Start the backend server
- `npm run dev` — (If configured) Start backend in development mode

### Frontend
- `npm run dev` — Start the frontend dev server
- `npm run build` — Build the frontend for production
- `npm run preview` — Preview the production build

---

## License
MIT
