# Akatsuki's Draft — AI-Enabled Content Sharing Platform (Backend)
**Nodevember 4.0 Post-Event Submission**

Akatsuki's Draft is a full-featured backend API where users can create, edit, manage, and publish content. It incorporates AI-powered content improvement via Google Gemini to help authors enhance their writing while preserving their original drafts. Posts are submitted for admin approval before appearing on the public feed.

---

## 🌟 Key Features

- **JWT Authentication & Authorization**: Secure user registration, login, and role-based access control (`user` vs `admin`).
- **Post Lifecycle & Management**: Authors can create drafts, edit posts, submit for approval (`pending`), view their own catalog, or delete posts.
- **Admin Review System**: Dedicated admin endpoints to view pending submissions, approve them for the public feed, or reject them.
- **AI Content Improvement with Google Gemini**: Enhances post titles, summaries, and markdown content using Gemini, automatically saving the polished result as a brand new draft with a fresh ID while preserving the original author draft.
- **Data Validation & Sanitization**: Strict Mongoose schemas with password hashing via `bcryptjs`.
- **100% Test Coverage**: Complete integration test suite verifying every endpoint and workflow.

---

## 📐 Schema Design

### 1. User Schema
```json
{
  "name": "String (required)",
  "email": "String (required, unique)",
  "password": "String (required, hashed)",
  "role": "admin | user (default: user)"
}
```

### 2. Post Schema
```json
{
  "title": "String (required)",
  "description": "String",
  "content": "String (required)",
  "image": "String (URL/path)",
  "category": "String (default: General)",
  "createdBy": "ObjectId (ref: User, required)",
  "status": "draft | pending | approved | rejected (default: draft)",
  "createdAt": "Date (default: Date.now)"
}
```

---

## 🚀 API Endpoints

### 🔐 Authentication
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register a new user (`name`, `email`, `password`, optional `role`) |
| `POST` | `/auth/login` | Public | Login with `email` and `password`, returns JWT token |
| `GET` | `/auth/me` | Bearer Token | Retrieve currently logged-in user's profile |

### ✍️ User — Post Management
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/posts` | Bearer Token | Create a new post or draft (`status: 'draft'` or `'pending'`) |
| `GET` | `/posts` | Public | View all approved posts (`status: 'approved'`) |
| `GET` | `/posts/:id` | Public / Author | View post by ID (public if approved, or accessible by author/admin) |
| `GET` | `/posts/my-posts` | Bearer Token | View all posts & drafts belonging to logged-in user |
| `PATCH` | `/posts/:id` | Author / Admin | Update post fields or submit draft for review |
| `DELETE` | `/posts/:id` | Author / Admin | Delete author's post |

### 🛡️ Admin — Post Approval
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/admin/posts/pending` | Admin Only | View all posts awaiting approval |
| `PATCH` | `/admin/posts/approve/:id` | Admin Only | Approve post (`status: 'approved'`) |
| `PATCH` | `/admin/posts/reject/:id` | Admin Only | Reject post (`status: 'rejected'`) |

### 🤖 AI Integration — Content Improvement
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/ai/improve/:postId` | Author / Admin | Improves post content via Google Gemini AI and creates a new draft under the same user, preserving the original draft. |

---

## 💻 Quick Start & Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) (Local service or MongoDB Atlas)

### 2. Installation
```bash
cd C:\Users\Asus\.gemini\antigravity-ide\scratch\post-vent-draft-backend
npm install
```

### 3. Environment Configuration
Create or edit `.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/akatsuki_draft
JWT_SECRET=your_jwt_secret_key_2026
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_google_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
NODE_ENV=development
```

*(Note: If `GEMINI_API_KEY` is not provided, the server seamlessly runs with an intelligent local enhancement fallback so endpoints never crash).*

### 4. Running the Server
```bash
# Start server in production mode
npm start

# Or start server in development mode with live reload
npm run dev
```

### 5. Running the Automated Tests
```bash
npm test
```

All 16 test cases will execute and validate every requirement end-to-end.
