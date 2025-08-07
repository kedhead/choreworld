# 🧹 ChoreWorld - Fun Family Chore Tracking App

A delightful and interactive web application that makes household chores fun for kids and easy to manage for parents! Built with modern 2025 web standards and designed to gamify the chore experience.

## ✨ Features

### 👨‍💼 For Parents (Admin Users)
- **Admin Dashboard** - Manage all family chores and users
- **Chore Management** - Add, edit, and remove chores from the system
- **User Management** - Create accounts for kids with secure authentication
- **Progress Tracking** - View detailed weekly summaries and historical data
- **Manual Controls** - Trigger daily assignments and dish duty rotation
- **Real-time Monitoring** - See completion rates and points earned

### 👶 For Kids (End Users)
- **Kid-Friendly Dashboard** - Colorful, fun interface with emojis and animations
- **Daily Chores** - View assigned chores with clear descriptions and point values
- **One-Click Completion** - Mark chores as done with celebration animations
- **Progress Tracking** - See completion rates and points earned
- **Achievement System** - Earn points and see weekly performance

### 🔄 Automated Systems
- **Daily Chore Assignment** - Automatically assigns random chores at 1:00 AM daily
- **Dish Duty Rotation** - Weekly rotation system (Monday-Sunday) that auto-rotates
- **Historical Tracking** - Maintains complete history of all completed chores
- **Weekly Summaries** - Automatic generation of family performance reports

## 🛠️ Technology Stack

### Backend
- **Node.js + Express** - Lightweight, fast server
- **SQLite Database** - File-based database (no server required)
- **JWT Authentication** - Secure token-based auth
- **bcryptjs** - Password hashing
- **node-cron** - Automated scheduling
- **CORS + Security** - Cross-origin and security middleware

### Frontend
- **React 18** - Modern React with hooks
- **Vite** - Lightning-fast development
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **Axios** - API communication
- **Lucide React** - Beautiful icons
- **React Hot Toast** - Elegant notifications

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ChoreWorld
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```
   This installs both backend and frontend dependencies.

3. **Start the development servers**
   ```bash
   npm run dev
   ```
   This starts both the backend (port 3001) and frontend (port 5173) servers.

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001/api

### Default Login Credentials
- **Username:** `admin`
- **Password:** `admin123`
- **Role:** Admin/Parent

## 📁 Project Structure

```
ChoreWorld/
├── server/                     # Backend Node.js application
│   ├── database/
│   │   ├── schema.sql         # Database schema and seed data
│   │   ├── database.js        # Database connection and helpers
│   │   └── choreworld.db      # SQLite database file (auto-created)
│   ├── middleware/
│   │   └── auth.js            # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js            # Authentication endpoints
│   │   ├── chores.js          # Chore management endpoints
│   │   └── assignments.js     # Assignment and summary endpoints
│   ├── services/
│   │   └── scheduler.js       # Automated scheduling logic
│   └── index.js               # Main server file
├── client/                     # Frontend React application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── contexts/          # React context providers
│   │   ├── pages/             # Main application pages
│   │   ├── App.jsx            # Main app component
│   │   └── main.jsx           # Application entry point
│   ├── public/                # Static assets
│   └── dist/                  # Built frontend files
├── package.json               # Root package.json with scripts
└── README.md                  # This file
```

## 🎯 Key Features Explained

### Daily Chore Assignment
- Runs automatically every day at 1:00 AM
- Randomly assigns one chore to each kid from the active chore pool
- Prevents duplicate assignments on the same day
- Can be manually triggered by admin users

### Dish Duty Rotation
- Automatically rotates every Monday at 12:01 AM
- Cycles through all kids in order
- Tracks current assignment for the week (Monday-Sunday)
- Can be manually rotated by admin users

### Point System
- Each chore has a configurable point value (1-10)
- Kids earn points when they complete chores
- Points are tracked in weekly summaries
- Leaderboard shows top performers

### Weekly Summaries
- Complete breakdown of family performance
- Individual completion rates and points
- Historical data with week navigation
- Visual progress indicators

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt for secure password storage
- **Role-based Access** - Admin vs Kid permissions
- **Input Validation** - Server-side validation for all inputs
- **SQL Injection Protection** - Parameterized queries
- **CORS Protection** - Cross-origin request filtering

## 🎨 UI/UX Features

- **Responsive Design** - Works on desktop, tablet, and mobile
- **Fun Animations** - Celebration effects when chores are completed
- **Emoji Integration** - Kid-friendly visual elements throughout
- **Color-coded Status** - Clear visual indicators for completion status
- **Toast Notifications** - Friendly success and error messages
- **Loading States** - Smooth loading indicators
- **Accessibility** - Keyboard navigation and screen reader support

## 📱 Mobile-Friendly

The application is fully responsive and works great on:
- 📱 Mobile phones (iPhone, Android)
- 📱 Tablets (iPad, Android tablets)  
- 💻 Desktop computers
- 🖥️ Large monitors

## 🚀 Deployment Options

### Affordable Hosting Solutions

1. **Option 1: Netlify + Railway**
   - Frontend: Deploy to Netlify (free tier)
   - Backend: Deploy to Railway ($5/month)
   - Total cost: $0-5/month

2. **Option 2: Vercel + Render**
   - Frontend: Deploy to Vercel (free tier)
   - Backend: Deploy to Render (free tier with limitations)
   - Total cost: $0/month

3. **Option 3: DigitalOcean App Platform**
   - Full-stack deployment on DigitalOcean
   - Total cost: $5/month

4. **Option 4: Shared Hosting**
   - Many shared hosts now support Node.js
   - Upload files via FTP/SFTP
   - Total cost: $3-10/month

### Production Build

1. **Build the frontend**
   ```bash
   npm run build
   ```

2. **Set environment variables**
   ```bash
   NODE_ENV=production
   JWT_SECRET=your-secure-secret-key
   PORT=3001
   ```

3. **Start the production server**
   ```bash
   npm start
   ```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
PORT=3001
```

### Database Configuration
The SQLite database is automatically created on first run. The schema includes:
- Default admin user (admin/admin123)
- Sample chores to get started
- All necessary tables and relationships

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill process on port 3001
   npx kill-port 3001
   ```

2. **Database locked error**
   ```bash
   # Delete the database file to reset
   rm server/database/choreworld.db
   ```

3. **Permission errors on Linux/Mac**
   ```bash
   # Make sure Node.js has proper permissions
   sudo chown -R $USER ~/.npm
   ```

### Development Tips

- Use `npm run server:dev` to run only the backend
- Use `npm run client:dev` to run only the frontend  
- Check the browser console for frontend errors
- Check the terminal for backend errors
- The database file is created automatically on first run

## 🤝 Contributing

This is a family project, but feel free to:
- Report bugs or issues
- Suggest new features
- Submit pull requests
- Share your own family's chore ideas!

## 📄 License

This project is open source and available under the MIT License.

## 🎉 Getting Started Tips

1. **First Login:** Use admin/admin123 to log in as a parent
2. **Add Kids:** Go to Admin Panel → Users → Add New User
3. **Add Chores:** Go to Admin Panel → Chores → Add New Chore
4. **Assign Chores:** Use "Assign Daily Chores" button or wait until 1 AM
5. **Track Progress:** Check the Weekly Summary page for family progress

---

Made with ❤️ for families who want to make chores fun! 🏠✨# force deploy
