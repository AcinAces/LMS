# LMS Project

This project contains a Next.js frontend and a Strapi backend, with a PostgreSQL database.

## Prerequisites

- Node.js (v18+)
- Docker (for local PostgreSQL database)

## Running Locally

1. **Start the Database**
   In the root directory, run:
   ```bash
   docker-compose up -d
   ```

2. **Start the Backend (Strapi)**
   ```bash
   cd backend
   npm run dev
   ```
   The backend will be available at http://localhost:1337

3. **Start the Frontend (Next.js)**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will be available at http://localhost:3000

## Deployment

- **Frontend:** Ready to be deployed to Vercel.
- **Backend:** Ready to be deployed to Railway (uses PostgreSQL).
