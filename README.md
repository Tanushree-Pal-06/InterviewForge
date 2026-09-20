# InterviewForge

AI-powered mock interview platform that helps students prepare for technical, behavioral, and project-based interviews through personalized question generation, automated evaluation, and performance analytics.

## Live Demo

Live Demo: https://interview-forge-sv7n.vercel.app

## Features

### Project-Based AI Interviews
- Upload project details or README content
- AI analyzes project architecture and implementation
- Generates project-specific interview questions
- Helps prepare for project discussions during internships and placements

### Technical Interview Practice
- DSA
- Frontend
- Backend
- DBMS
- Operating Systems
- OOP
- HR Interviews

### Smart Interview Sessions
- Select 5, 10, or 15 questions
- Optional interview timer
- Auto-submit on timeout
- Real-time answer tracking

### AI Evaluation
- Automated scoring
- Personalized feedback
- Weak area identification
- Improvement suggestions

### Analytics Dashboard
- Total interviews
- Average score
- Best score
- Weak area trends
- Interview history tracking

### Account Management
- Authentication with JWT
- Profile management
- Account deletion
- Dark/Light mode

## Tech Stack

**Frontend**
- React
- React Router
- Tailwind CSS
- Vite

**Backend**
- Node.js
- Express.js
- MongoDB Atlas
- JWT Authentication

**AI**
- Google Gemini API

**Deployment**
- Vercel
- MongoDB Atlas

## Demo Account

**Email**: user1@test.com
**Password**: 123456

## Local Setup

### 1. Clone Repository

```bash
git clone https://github.com/aarti773/InterviewForge.git
```

### 2. Install Frontend Dependencies

```bash
cd client
npm install
```

### 3. Install Backend Dependencies

```bash
cd server
npm install
```

### 4. Start Frontend

```bash
cd client
npm run dev
```

### 5. Start Backend

```bash
cd server
npm run dev
```

## Environment Variables

### Server

```env
MONGO_URI
JWT_SECRET
GEMINI_API_KEY
GEMINI_MODEL
CLIENT_URL
PORT
```

### Client

```env
VITE_API_URL
```

## Future Improvements

- Resume-based interviews
- Voice interviews
- Detailed performance charts
- Interview sharing
- Multi-round interview simulations

## Author

Aarti(IIT Roorkee)