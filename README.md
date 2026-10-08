# EmpathWrite AI

A premium, full-stack AI Blog Generator built on the MERN stack. EmpathWrite goes beyond robotic AI text generation by focusing on collaborative co-writing, humanization filters, dynamic audience persona alignment, and a fluid, polished editor experience — powered by the Google Gemini API.

---

## Features

- **Secure Auth** — JWT stored in HTTP-Only cookies; passwords hashed with bcrypt (10 salt rounds)
- **Audience Alignment Wizard** — Multi-step onboarding wizard to configure target demographic, objective, and narrative tone using Framer Motion slide animations
- **Structured Outline Builder** — Gemini-powered JSON blueprint generator (H2/H3 hierarchy) with full drag-and-reorder controls
- **Real-Time SSE Streaming** — Token-by-token content delivery from Gemini directly into a TipTap rich text canvas
- **Inline AI Context Menu** — Highlight any text to trigger a floating action menu: Humanize, Expand, Condense, and Tone shift
- **Anti-AI Phrasing Engine** — Systemic prompt directives that strip corporate filler phrases and enforce natural, varied sentence cadence
- **Mock Mode** — Full end-to-end functionality without a Gemini API key, for development and testing

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS v4, Framer Motion, TipTap, Axios |
| Backend | Node.js, Express.js, Mongoose |
| Database | MongoDB |
| AI | Google Gemini API (`@google/generative-ai`) |
| Auth | JWT, bcrypt, HTTP-Only Cookies |

---

## Project Structure

```
AI-Blog-Generator/
├── backend/
│   ├── config/
│   │   └── db.js               # Mongoose connection
│   ├── controllers/
│   ├── middleware/
│   │   └── auth.js             # JWT cookie validation
│   ├── models/
│   │   ├── User.js             # User schema w/ bcrypt pre-save hook
│   │   └── Blog.js             # Blog schema w/ configuration + outline
│   ├── routes/
│   │   ├── auth.js             # /api/auth (signup, login, logout)
│   │   ├── blogs.js            # /api/blogs (CRUD)
│   │   └── generate.js         # /api/blogs/:id/outline, /stream, /inline-edit
│   ├── .env                    # Environment config (not committed)
│   └── server.js               # Express app entrypoint
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── Wizard.jsx      # Multi-step onboarding wizard
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Signup.jsx
    │   │   ├── Dashboard.jsx   # Campaign grid + metrics
    │   │   └── EditorPage.jsx  # TipTap canvas + SSE stream + inline menu
    │   ├── App.jsx             # Router + AuthContext + Axios interceptors
    │   ├── main.jsx
    │   └── index.css           # Tailwind v4 + custom TipTap styles
    ├── vite.config.js          # Vite + Tailwind plugin + /api proxy
    └── index.html
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB running locally on `mongodb://127.0.0.1:27017` (or a MongoDB Atlas URI)
- A Google Gemini API key (optional — app runs in mock mode without one)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/AI-Blog-Generator.git
cd AI-Blog-Generator
```

### 2. Configure the backend

```bash
cd backend
cp .env.example .env   # or edit .env directly
```

Edit `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/empathwrite
JWT_SECRET=your_strong_secret_here
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=development
```

> If `GEMINI_API_KEY` is not set, the app automatically falls back to **Mock Mode** — all AI endpoints return pre-defined structured responses for testing.

### 3. Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 4. Run the servers

Open two terminals:

```bash
# Terminal 1 — Backend API (port 5000)
cd backend && npm start

# Terminal 2 — Frontend Dev Server (port 5173)
cd frontend && npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## API Reference

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Register new user, returns JWT cookie | No |
| `POST` | `/api/auth/login` | Authenticate user, returns JWT cookie | No |
| `POST` | `/api/auth/logout` | Clears session cookie | Yes |
| `GET` | `/api/blogs` | List all blogs for current user | Yes |
| `POST` | `/api/blogs` | Create a new blog draft | Yes |
| `GET` | `/api/blogs/:id` | Fetch a single blog | Yes |
| `PUT` | `/api/blogs/:id/save` | Save editor content | Yes |
| `DELETE` | `/api/blogs/:id` | Delete a blog | Yes |
| `POST` | `/api/blogs/:id/outline` | Generate structured JSON outline via Gemini | Yes |
| `GET` | `/api/blogs/:id/stream` | Stream blog content via SSE | Yes |
| `POST` | `/api/blogs/inline-edit` | Transform selected text (Humanize, Expand, Condense, Tone) | Yes |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Backend port (default: `5000`) |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret key for signing JWTs |
| `GEMINI_API_KEY` | No | Google Gemini API key. Falls back to mock mode if unset. |
| `NODE_ENV` | No | `development` or `production` |

---

## Security Notes

- The Gemini API key is **strictly server-side** — never exposed to the client
- All cookies are `HttpOnly`, `SameSite: strict`, and `Secure` in production
- All protected routes validate the JWT on every request via the `protect` middleware
- IDOR protection enforced on all blog operations: queries always filter by both `_id` and `userId`

---

## License

MIT
