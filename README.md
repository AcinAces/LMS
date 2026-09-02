# 🎓 Modern LMS Platform

A modern, fullstack Learning Management System (LMS) and interactive educational platform designed for computer science students, instructors, content managers, and administrators. The platform combines video lessons, structured problem-solving tracks, interactive proctored quizzes, a built-in Cloud Monaco IDE, an educational blog library, and a competitive student leaderboard with full bilingual (English & Bangla) support.

---

## 🚀 What the Platform Does

- **For Students:**
  - Browse and enroll in curated programming and algorithmic courses (Theory & Contest tracks).
  - Watch interactive video lectures with real-time video progress synchronization and reading notes.
  - Complete timed, proctored quizzes with instant auto-grading, solution breakdowns, and anti-cheat guardian monitoring.
  - Write, compile, and execute code in various programming languages directly in the browser via an integrated Cloud IDE.
  - Track curriculum milestones and module progress on a personal Learning Hub dashboard.
  - Ask 1-to-1 questions directly to course authors and instructors on individual lesson pages.
  - Compete on a platform-wide Top 20 student leaderboard scored across quiz performance, course completion, and exam integrity.
  - Read comprehensive computer science articles and implementation walkthroughs in the educational blog library.
  - Seamlessly switch the entire user interface between English and Bengali (বাংলা).

- **For Instructors & Content Managers:**
  - Create and manage courses, tags, syllabus outlines, and multimedia video lessons.
  - Author proctored assessments with customizable question palettes, timers, and multiple-choice options.
  - Publish categorized educational blog posts with rich Markdown and KaTeX math formatting.
  - Review student enrollment and track curriculum engagement.

- **For Administrators:**
  - Complete control over user management, role assignments (Admin, Content Manager, Instructor, Student), course publishing, lesson curation, and system-wide settings.

---

## ✨ Features Completed

1. **Authentication + Role-Based Access Control (RBAC):**
   - Secure registration, login, and session persistence using JWT tokens.
   - Multi-role permission system segregating views and APIs across `Admin`, `Content Manager`, `Instructor`, and `Student`.

2. **Course Management (Admin / Content Manager / Instructor):**
   - CRUD workflows for creating & updating courses with thumbnails, tags, and category tracks.

3. **Course Enrollment (Student):**
   - One-click instant enrollment in published theory and contest courses.
   - Status indicators across catalog cards and detail pages.
   - Other roles cannot enroll.

4. **Lesson Viewing (Student):**
   - Custom video player container with progress sync, auto-resume, and playback timeline tracking.
   - Interactive 1-to-1 lesson Q&A chat directly with the course author.

5. **Progress Tracking (Student):**
   - Real-time lesson completion tracking and percentage progress bars.
   - Dedicated "My Courses" student learning hub with KPI summary cards (`Total Enrolled`, `In Progress`, `Completed`, `Overall Progress`).
   - Dynamic tag filtering and status tabs.

6. **Quiz with Auto-Grading:**
   - Timed multiple-choice assessments with real-time question palette navigation.
   - Instant automated grading, score calculation, pass/fail thresholds, and detailed answer solution breakdowns.

7. **Admin Panel:**
   - Dedicated, authenticated admin dashboard for managing users, roles, courses, lessons, quizzes, featured items, and progress records.

8. **Blogs:**
   - Add/update blogs using pictures and markdown langugage.

---

## 🌟 Extra Features

1. **Bilingual Support (Bangla + English):**
   - Full site-wide internationalization across all public and student surfaces with dynamic language toggle (English <-> বাংলা).
   - Staff dashboards (`/admin`, `/content-manager`, `/instructor`) intentionally maintained in English for unified administrative operations.

2. **Cloud IDE:**
   - In-browser Monaco code editor (VS Code experience) supporting C++, C, Java, Python, JavaScript, and more.
   - Multi-tab output console with Standard Input (`stdin`) support, execution timers, memory consumption metrics, and dark mode syntax highlighting.

3. **Proctored Quiz Engine (Proctor Guardian):**
   - Fullscreen enforcement during exam sessions.
   - Real-time tab-switching, window minimization, and focus-blur violation tracking.
   - Strike penalty point deductions and automatic exam termination with 0 marks upon accumulating 3 strikes.

4. **Student Leaderboard:**
   - Competitive Top 20 student ranking algorithm combining quiz scores (+10/mark), passed exams (+15), completed courses (+50), completed lessons (+5), violation deductions (-5/score), and retake penalties (-2).
   - Top 3 scholars podium, live search filter, and scoring breakdown rule modal.

---

## 🛠️ Tech Stack

- **Frontend:**
  - **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack) & [React 19](https://react.dev/)
  - **Language:** TypeScript
  - **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
  - **Code Editor:** `@monaco-editor/react`
  - **Math & Markdown:** `react-markdown`, `remark-gfm`, `remark-math`, `rehype-katex`, `katex`
  - **Media:** `react-youtube`

- **Backend:**
  - **Headless CMS:** [Strapi 5](https://strapi.io/)
  - **Database:** PostgreSQL (Production / Docker) / SQLite (Local fallback)
  - **Authentication:** JWT, Role-Based Access Control (`@strapi/plugin-users-permissions`)

---

## 💻 Running the Project Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v20.x or higher recommended)
- [npm](https://www.npmjs.com/) (v10+ or higher)
- [Docker](https://www.docker.com/) (Optional, if running PostgreSQL via Docker)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/AcinAces/LMS.git
cd LMS
```

---

### Step 2: Database Setup (Optional if using Docker)
To spin up a local PostgreSQL container:
```bash
docker-compose up -d
```
*(If you are using a cloud PostgreSQL instance like Railway/Supabase or SQLite, configure `backend/.env` accordingly).*

---

### Step 3: Backend Setup (Strapi CMS)

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `backend/.env`:
   ```env
   HOST=0.0.0.0
   PORT=1337
   APP_KEYS=sampleKey1,sampleKey2,sampleKey3,sampleKey4
   API_TOKEN_SALT=sampleApiTokenSalt
   ADMIN_JWT_SECRET=sampleAdminJwtSecret
   JWT_SECRET=sampleJwtSecret
   TRANSFER_TOKEN_SALT=sampleTransferTokenSalt
   ENCRYPTION_KEY=sampleEncryptionKey

   # Database Configuration (PostgreSQL example)
   DATABASE_CLIENT=postgres
   DATABASE_URL=postgresql://postgres:password@localhost:5432/lms
   DATABASE_SSL=false
   ```

4. Start the Strapi development server:
   ```bash
   npm run dev
   ```
   The backend API and Strapi Admin will be accessible at:
   - API: `http://localhost:1337`
   - Strapi Admin Panel: `http://localhost:1337/admin`

---

### Step 4: Frontend Setup (Next.js)

1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:1337
   ```

4. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   The frontend application will be accessible at:
   - Application URL: `http://localhost:3000`

---

## 🧪 Build & Verification Commands

- **Frontend Typecheck:**
  ```bash
  cd frontend
  npx tsc --noEmit
  ```

- **Frontend Production Build:**
  ```bash
  cd frontend
  npm run build
  ```

- **Backend Production Build:**
  ```bash
  cd backend
  npm run build
  ```

---

## 📄 License
This project is private and developed for educational and portfolio demonstration.
