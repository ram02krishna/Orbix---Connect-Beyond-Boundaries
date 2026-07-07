# Orbix - Connect Beyond Boundaries

![Orbix Banner](https://via.placeholder.com/1200x400.png?text=Orbix+-+Connect+Beyond+Boundaries)

Orbix is a highly sophisticated, full-stack real-time chat application designed to provide seamless and instant communication. Built with a modern tech stack and a beautifully crafted UI, Orbix delivers a premium user experience featuring secure authentication, rich media sharing, peer-to-peer calling, and interactive statuses.

## ✨ Key Features

### Core Messaging
- **Real-Time Communication:** Instant message delivery using WebSockets (`Socket.io`) with typing indicators and read receipts.
- **Direct & Group Chats:** Support for one-on-one conversations and fully-featured group chats with customizable roles (Owner, Admin, Member).
- **Rich Media Sharing:** Share images, videos, audio clips, and files seamlessly via Cloudinary integration.
- **Emoji Reactions:** Express yourself by reacting to specific messages.
- **Message Management:** Reply to, edit, or delete messages (for everyone or just yourself).

### Advanced Communication
- **Voice & Video Calls:** Crystal-clear, peer-to-peer audio and video calling powered by `WebRTC`.
- **Status Updates (Stories):** Post ephemeral photo, video, or text statuses that expire, and see who viewed them.
- **User Presence:** Real-time online/offline status tracking, showing exactly when friends are active.

### Privacy & Security
- **Secure Authentication:** JWT-based authentication with high-security password hashing using `Argon2`.
- **User Blocking:** Maintain your privacy by blocking unwanted users from messaging or calling you.
- **Granular Group Permissions:** Admins can restrict messaging and chat info modifications to maintain order in large groups.
- **Email & Phone Verification:** Ensure account authenticity via verification codes (powered by `Nodemailer`).

### Performance & Scalability
- **Modern Tech Stack:** Built on `Next.js 15` (App Router) and `React 19`.
- **Optimized Data Flow:** Efficient data fetching and caching with `@tanstack/react-query` and global state management with `Zustand`.
- **Scalable Architecture:** Redis integration via `@upstash/redis` and Socket.io Redis adapter for multi-instance horizontal scaling.

---

## 🛠️ Tech Stack

### Frontend (Client)
- **Framework:** Next.js (v15) & React (v19)
- **Styling:** Tailwind CSS & Framer Motion for beautiful, fluid animations.
- **State Management:** Zustand (Global State) & React Query (Data Fetching/Caching)
- **UI Components:** Radix UI & Lucide React
- **Forms & Validation:** React Hook Form & Zod
- **Real-Time & Calls:** Socket.io-client, WebRTC

### Backend (Server)
- **Runtime & Framework:** Node.js, Express.js
- **Language:** TypeScript
- **Real-Time Engine:** Socket.io
- **ORM & Database:** Prisma ORM with PostgreSQL
- **Caching & Pub/Sub:** Redis (@upstash/redis)
- **Authentication:** JWT, Argon2
- **Cloud Services:** Cloudinary (Media), Nodemailer (Emails)
- **Security:** Helmet, express-rate-limit

---

## 📂 Project Structure

The project is structured as a monorepo containing both the client and server codebases.

```text
Orbix/
├── client/                 # Next.js frontend application
│   ├── app/                # Next.js App Router layout and pages
│   ├── components/         # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   └── package.json        # Frontend dependencies
│
├── server/                 # Express.js backend application
│   ├── src/                # Backend source code (Controllers, Routes, Middlewares, Sockets, Services)
│   ├── prisma/             # Database schema and seed data
│   ├── dist/               # Compiled TypeScript code
│   └── package.json        # Backend dependencies
│
└── README.md               # Project documentation
```

---

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites
- Node.js (v20.0.0 or higher)
- npm, yarn, or pnpm
- PostgreSQL Database
- Redis Instance (Optional for local dev, required for production scaling)
- Cloudinary Account (for media uploads)

### 1. Clone the repository
```bash
git clone https://github.com/ram02krishna/Orbix---Connect-Beyond-Boundaries.git
cd Orbix---Connect-Beyond-Boundaries
```

### 2. Backend Setup
Navigate to the server directory and install dependencies:
```bash
cd server
npm install
```
Configure environment variables:
```bash
cp .env.example .env
```
Edit `.env` with your credentials:
- `DATABASE_URL` (PostgreSQL connection string)
- `JWT_SECRET`
- Cloudinary credentials (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`)
- Redis credentials (if applicable)

Initialize the database:
```bash
npm run db:generate
npm run db:push
# Optional: Seed the database
npm run db:seed
```

Start the backend development server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal and navigate to the client directory:
```bash
cd client
npm install
```

Configure environment variables:
```bash
cp .env.local.example .env.local
```
Edit `.env.local` to point to your backend API (default is usually `http://localhost:5000` depending on your setup).

Start the Next.js development server:
```bash
npm run dev
```

The client will be running on `http://localhost:3000` and the server on `http://localhost:5000` (or as configured).

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! 
Feel free to check the [issues page](#) if you want to contribute.

## 📝 License

This project is licensed under the MIT License.
