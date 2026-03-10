# Real-Time Collaborative Code Editor

A real-time collaborative coding platform where multiple users can write, edit, and execute code together in shared rooms.

## Features

### Core Features
- **User Authentication** - Email/Password and Google OAuth sign-in
- **Room Management** - Create, join, and manage coding rooms
- **Real-Time Code Editing** - Live synchronization with cursor positions visible to all participants
- **Multi-Language Support** - 13+ programming languages (Python, JavaScript, Java, C++, Go, Rust, etc.)
- **Code Execution** - Run code directly in the browser using JDoodle API
- **Live Chat** - Real-time messaging with all room participants

### Additional Features
- **Invite Sharing** - Share rooms via QR code, copy link, email, or WhatsApp
- **Download Code** - Export code with correct file extensions
- **Theme Toggle** - Switch between dark and light themes
- **Code Templates** - Language-specific starter templates (auto-switch on language change)
- **Room Settings** - Rename rooms, toggle privacy, delete rooms
- **Voice Messages** - Record and send voice messages in chat
- **Video Chat** - Peer-to-peer video calls using WebRTC
- **Resizable Chat Panel** - Adjustable chat window size

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS 4
- Monaco Editor (VS Code editor)
- Firebase Web SDK (Auth & Firestore)
- WebRTC (video chat)

### Backend
- Node.js + Express + TypeScript
- Firebase Admin SDK
- JDoodle API (code execution)

### Database & Auth
- Firebase Firestore (real-time database)
- Firebase Authentication

## Important Notes

⚠️ **No Code History** - This application does not store version history of code changes. Only the current state of the code is saved. If you need to preserve previous versions, please download your code before making changes.

## Project Structure

```
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/          # Login, Signup
│   │   │   ├── Dashboard/     # Room list
│   │   │   └── Room/          # Editor, Chat, Video, Settings
│   │   ├── context/           # Auth context
│   │   ├── services/          # Firebase operations
│   │   └── types/             # TypeScript types
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── config/            # Firebase config
│   │   ├── controllers/       # API handlers
│   │   ├── middleware/        # Auth middleware
│   │   ├── routes/            # API routes
│   │   └── server.ts          # Express server
│   └── package.json
│
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- Firebase project with Firestore and Authentication enabled
- JDoodle API credentials (for code execution)

### Environment Variables

#### Backend (`backend/.env`)
```
PORT=5000
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
JDOODLE_CLIENT_ID=your-jdoodle-client-id
JDOODLE_CLIENT_SECRET=your-jdoodle-client-secret
```

#### Frontend (`frontend/.env`)
```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_API_URL=http://localhost:5000
```

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/J-vijayalakshmi/collaborative-coding.git
   cd collaborative-coding
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**
   - Copy `.env.example` to `.env` in both `backend/` and `frontend/`
   - Fill in your Firebase and JDoodle credentials

5. **Run the backend**
   ```bash
   cd backend
   npm run dev
   ```

6. **Run the frontend** (in a new terminal)
   ```bash
   cd frontend
   npm run dev
   ```

7. Open `http://localhost:5173` in your browser

## Supported Languages

| Language | File Extension |
|----------|---------------|
| Python | .py |
| JavaScript | .js |
| TypeScript | .ts |
| Java | .java |
| C++ | .cpp |
| C | .c |
| C# | .cs |
| Go | .go |
| Rust | .rs |
| Ruby | .rb |
| PHP | .php |
| Swift | .swift |
| Kotlin | .kt |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | User login |
| POST | /api/rooms | Create new room |
| GET | /api/rooms | Get user's rooms |
| GET | /api/rooms/:id | Get room details |
| POST | /api/execute | Execute code |

## License

MIT License
