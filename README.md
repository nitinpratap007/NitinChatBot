# NitinChatBot — AI-Powered Student Learning Assistant

> **WA-C1 Full-Stack Mini Project**  
> Live: https://nitinchatbot.netlify.app

---

## Project Purpose

NitinChatBot is an AI-powered learning platform for students. It combines a **Gemini-powered AI chatbot** that answers any question (and recommends relevant courses), with a full CRUD **Learning Notes** system and a **Study Collections** organiser — giving students one place to learn, ask, and take notes.

---

## Main Features

| Feature | Description |
|---|---|
| 🤖 AI Chatbot | Gemini 2.5 Flash — answers any question, recommends courses |
| 📚 Courses | Browse all available learning courses with category filters |
| 📝 Learning Notes | Create, read, update, delete personal study notes (full CRUD) |
| 🗂️ Study Collections | Group notes by topic/subject |
| 🔐 Admin Dashboard | Manage courses and view chat history (password protected) |

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend (Legacy) | Vanilla HTML, CSS, JavaScript |
| Frontend (Dashboard) | **React 18 + Vite + React Router v6** |
| Backend | **Netlify Functions** (Node.js, CommonJS) |
| Database | **Supabase (PostgreSQL)** with RLS |
| AI | **Google Gemini 2.5 Flash** API |
| Auth | **JWT** (jsonwebtoken) — admin only |
| Hosting | **Netlify** (CI/CD from GitHub) |

---

## Architecture

```
CourseBot-APK/
├── www/                        ← Netlify publish directory
│   ├── index.html              ← Landing page (vanilla)
│   ├── student.html            ← Legacy chatbot (vanilla)
│   ├── admin.html              ← Admin dashboard (vanilla)
│   ├── admin-login.html        ← Admin login (vanilla)
│   └── dashboard/              ← React app (built by Vite)
│       └── index.html
│
├── frontend/                   ← React source (Vite)
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── Courses.jsx
│       │   ├── Notes.jsx       ← Full CRUD resource
│       │   ├── Collections.jsx
│       │   └── Chatbot.jsx
│       ├── App.jsx
│       ├── api.js
│       └── index.css
│
├── netlify/functions/          ← Serverless backend
│   ├── query.js                ← POST /api/query (Gemini AI)
│   ├── courses.js              ← GET/POST/PUT/DELETE /api/courses
│   ├── notes.js                ← GET/POST/PUT/DELETE /api/notes
│   ├── collections.js          ← GET/POST/PUT/DELETE /api/collections
│   ├── login.js                ← POST /api/auth/login
│   └── admin-queries.js        ← GET /api/admin/queries
│
└── netlify.toml                ← Build config + redirects
```

---

## Three Core Resources (WA-C1)

| Resource | Table | CRUD |
|---|---|---|
| **Courses** | `courses` | Create ✅ Read ✅ Update ✅ Delete ✅ |
| **Learning Notes** | `learning_notes` | Create ✅ Read ✅ Update ✅ Delete ✅ |
| **Study Collections** | `study_collections` | Create ✅ Read ✅ Update ✅ Delete ✅ |

**Primary CRUD resource for WA-C1:** `learning_notes`

---

## API Endpoints

### Courses
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/courses` | None | List all courses |
| POST | `/api/courses` | JWT | Add a course |
| PUT | `/api/courses/:id` | JWT | Update a course |
| DELETE | `/api/courses/:id` | JWT | Delete a course |

### Learning Notes
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/notes` | None | List all notes (optional `?collection_id=`) |
| GET | `/api/notes/:id` | None | Get single note |
| POST | `/api/notes` | None | Create note |
| PUT | `/api/notes/:id` | None | Update note |
| DELETE | `/api/notes/:id` | None | Delete note |

### Study Collections
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/collections` | None | List all collections (with note count) |
| GET | `/api/collections/:id` | None | Get single collection |
| POST | `/api/collections` | None | Create collection |
| PUT | `/api/collections/:id` | None | Update collection |
| DELETE | `/api/collections/:id` | None | Delete collection |

### Other
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/query` | None | AI chatbot (Gemini) |
| POST | `/api/auth/login` | None | Admin login → JWT |
| GET | `/api/admin/queries` | JWT | View chat history |

---

## Environment Variables

> ⚠️ Never commit actual values. Set these in Netlify → Site configuration → Environment variables.

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service-role key (server only) |
| `GEMINI_API_KEY` | Google Gemini API key |
| `JWT_SECRET` | Secret for signing admin JWT tokens |
| `ADMIN_PASSWORD` | Admin dashboard password |

---

## Local Installation

### Prerequisites
- Node.js 18+
- Netlify CLI: `npm install -g netlify-cli`
- A Supabase project (tables created via migration)

### 1. Clone & Install

```bash
git clone https://github.com/nitinpratap007/NitinChatBot.git
cd NitinChatBot
npm install
```

### 2. Install React Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### 3. Set Environment Variables

Create a `.env` file in the project root (for local `netlify dev`):

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret_string
ADMIN_PASSWORD=your_admin_password
```

### 4. Database Setup

Run the migration SQL in your Supabase SQL Editor:

```bash
# Open supabase-migration-wa-c1.sql and paste into Supabase SQL Editor
# Then run supabase-schema.sql if the base tables don't exist
```

---

## Running Locally

### Option A — Full Stack (Recommended)

```bash
# Terminal 1: Start Netlify Dev (functions + vanilla site on port 8888)
netlify dev

# Terminal 2: Start React Dashboard (Vite dev server on port 5173)
cd frontend
npm run dev
```

- Vanilla site: http://localhost:8888
- React dashboard: http://localhost:5173/dashboard

### Option B — React Build Only

```bash
cd frontend
npm run build
# Built files go to www/dashboard/
# Then serve www/ with any static server
```

---

## Building for Production

```bash
# Build React app into www/dashboard/
cd frontend && npm run build && cd ..

# Or let Netlify build automatically (netlify.toml handles it)
```

---

## Migration Instructions

1. Open [Supabase SQL Editor](https://supabase.com/dashboard)
2. Run `supabase-schema.sql` (creates `courses` and `queries` tables)
3. Run `supabase-migration-wa-c1.sql` (creates `learning_notes` and `study_collections`)

Both scripts are idempotent (`CREATE TABLE IF NOT EXISTS`) — safe to run multiple times.

---

## Testing

### Backend (via browser/curl)

```bash
# List courses (public)
curl https://nitinchatbot-apk.netlify.app/api/courses

# Create note
curl -X POST https://nitinchatbot-apk.netlify.app/api/notes \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","content":"Test content"}'

# List notes
curl https://nitinchatbot-apk.netlify.app/api/notes

# Update note (replace :id)
curl -X PUT https://nitinchatbot-apk.netlify.app/api/notes/:id \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Title"}'

# Delete note
curl -X DELETE https://nitinchatbot-apk.netlify.app/api/notes/:id
```

### Frontend

1. Visit `/dashboard` — verify stats load
2. Visit `/dashboard/courses` — verify course cards appear
3. Visit `/dashboard/notes` — create, edit, delete a note
4. Visit `/dashboard/collections` — create, edit, delete a collection
5. Visit `/dashboard/chatbot` — send a message, verify Gemini responds
6. Visit `/student.html` — verify existing chatbot still works
7. Visit `/admin-login.html` → login → `/admin.html` — verify admin dashboard still works

---

## Deployment

Deployment is handled automatically by Netlify on push to `master`.

> ⚠️ **Never push directly to `master` without testing on a feature branch first.**

Feature branch deploy preview is created automatically by Netlify for every push to a non-master branch.

---

## Known Limitations

- Admin course management is on the existing vanilla JS admin page, not the React dashboard
- Notes and collections have no user authentication (all public) — appropriate for a student demo app
- Gemini API responses are truncated to 500 chars when saved to query history
- No pagination on notes/courses lists (fine for demo scale)

---

## Reviewer User Flow

1. **Home:** `https://nitinchatbot-apk.netlify.app` — landing page
2. **React Dashboard:** `/dashboard` — stats, quick actions
3. **Browse Courses:** `/dashboard/courses` — filter by category
4. **Create Notes:** `/dashboard/notes` → "+ New Note" — full CRUD
5. **Organise:** `/dashboard/collections` → create collection → assign notes to it
6. **Chat with AI:** `/dashboard/chatbot` — ask any question
7. **Legacy Chatbot:** `/student.html` — still works
8. **Admin:** `/admin-login.html` → password → `/admin.html` — course management
