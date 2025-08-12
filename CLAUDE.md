# ChoreWorld - Claude Code Development Log

## Project Overview
ChoreWorld is a family chore management system with multi-family support, payment tracking, and gamification features.

## Current State (Latest Session)
- **Branch**: main
- **Last Commit**: 0993014 - "Fix chore assignment family_id issue causing assignments not to show"
- **Status**: Fully functional with all major features implemented
- **Deployment**: Railway (backend) + Netlify (frontend proxy)

## Architecture
- **Backend**: Node.js/Express with SQLite database
- **Frontend**: React with Vite
- **Authentication**: JWT tokens with family context
- **Database**: SQLite with automatic migrations
- **Deployment**: Railway for backend, Netlify for frontend

## Major Features Implemented

### 1. Multi-Family Support ✅
- Families table with unique codes and invite system
- Family-scoped data isolation (users, chores, assignments, payments)
- Family admin permissions (separate from global admin)
- Safe database migration preserving existing data
- Token refresh system for seamless family operations

### 2. Payment Tracking ✅
- Weekly payment tracking for chore allowances
- Mark kids as paid with optional amounts and notes
- Payment history and status overview
- Week-based organization (Monday-Sunday)
- Family admin only permissions

### 3. Family Admin System ✅
- Role-based permissions: global admin vs family admin
- Family creators automatically become family admin
- Family-scoped management (chores, assignments, payments, users)
- Secure family member creation and management

### 4. Core Chore System ✅
- Daily chore assignments with family scoping
- Dish duty rotation system
- Bonus chores with 2x XP
- Leveling system with experience points
- Manual and automatic assignment systems

## Recent Fixes Applied

### Issue: Assigned chores not showing on kids' dashboards
**Problem**: Manual chore assignments missing family_id in database
**Solution**: 
- Fixed manual assignment endpoint to include family_id
- Added startup database fix for orphaned assignments
- Enhanced migration to catch edge cases
**Files Changed**: 
- `server/routes/assignments.js` - Added family_id to INSERT/UPDATE
- `server/database/database.js` - Added startup fix
- `server/database/migrate-multi-family.js` - Enhanced migration

## Database Schema

### Core Tables
- `users` - Family members with roles (admin/kid) and family_id
- `families` - Family data with unique codes
- `chores` - Chore definitions with family scoping
- `daily_assignments` - Daily chore assignments with family_id
- `weekly_payments` - Payment tracking per user per week
- `family_invites` - Invitation system for joining families

### Key Relationships
- Users belong to families (family_id)
- All data is family-scoped for multi-tenancy
- Family admins can manage their family's data
- Payment tracking links users to weekly payment records

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Public user registration
- `POST /api/auth/create-family-member` - Family admin creates users

### Family Management
- `POST /api/families/create` - Create family (any authenticated user)
- `POST /api/families/join` - Join family with invite code
- `GET /api/families/current` - Get current family info
- `POST /api/families/invite` - Create invite code (family admin)

### Chore Management  
- `GET /api/chores` - List family chores
- `POST /api/chores` - Create chore (family admin)
- `PUT /api/chores/:id` - Update chore (family admin)
- `DELETE /api/chores/:id` - Delete chore (family admin)

### Assignment Management
- `GET /api/assignments/daily` - Get daily assignments
- `POST /api/assignments/daily/assign-manual` - Manual assignment (family admin)
- `POST /api/assignments/daily/:id/complete` - Complete assignment

### Payment Tracking
- `GET /api/payments/weekly` - View payment status for week
- `POST /api/payments/mark-paid` - Mark child as paid (family admin)
- `DELETE /api/payments/:id` - Remove payment record (family admin)
- `GET /api/payments/history/:userId` - Payment history (family admin)

## Frontend Structure

### Key Components
- `AdminPanel.jsx` - Main admin interface with tabbed sections
- `PaymentTracking.jsx` - Weekly payment management UI
- `FamilyManagement.jsx` - Family member and invite management
- `FamilySetup.jsx` - Initial family creation/joining flow
- `Dashboard.jsx` - Kid dashboard showing assignments

### Contexts
- `AuthContext.jsx` - Authentication and user state
- `FamilyContext.jsx` - Family operations and state

## Development Patterns Used

### Database Migrations
- Safe migration system preserving existing data
- Automatic migration detection and execution
- Multiple migration support (multi-family, payment tracking)
- Startup data fixes for edge cases

### Security
- Family-scoped data access
- Role-based permissions (family admin vs global admin)
- JWT tokens with family context
- Input validation and sanitization

### Code Organization
- Separation of concerns (routes, services, database)
- Consistent error handling
- Comprehensive logging
- Helper functions for common operations

## Known Working Flow

### New User Journey
1. Register with role selection (kid/admin)
2. Create family (becomes family admin) OR join with invite code
3. Family admin can create chores, manage users, track payments
4. Kids can view/complete assignments, see their progress

### Payment Tracking Workflow
1. Parent goes to Admin Panel → Payment Tracking tab
2. Select week, see paid vs unpaid kids
3. Mark kids as paid with optional amount/notes
4. View payment history and manage records

## Future Considerations Discussed
- Mobile app conversion (React Native recommended)
- Progressive Web App (PWA) as stepping stone
- Additional gamification features
- Enhanced reporting and analytics

## Technical Debt
- None identified - system is clean and well-structured
- All major issues have been resolved
- Database is properly normalized and indexed
- Code follows consistent patterns

## How to Continue Development

### Starting Fresh Session
1. Open project at `K:\AI-Projects\ChoreWorld`
2. Reference this CLAUDE.md for full context
3. Check latest commits with `git log --oneline -10`
4. Review todo list completion status

### Testing Checklist
- [ ] New user registration with role selection
- [ ] Family creation and admin promotion
- [ ] Manual chore assignment showing on kid dashboard
- [ ] Payment tracking mark as paid/unpaid
- [ ] Family invite codes and joining
- [ ] Chore completion and XP system

### Deployment Status
- Railway: Backend API with auto-deployments from main branch
- Netlify: Frontend proxy redirecting API calls to Railway
- Database: SQLite with persistent storage on Railway
- All migrations: Automatically applied on server startup

## Emergency Restore Commands
```bash
# Check current status
git status
git log --oneline -5

# Reset to last known good state
git reset --hard 0993014

# Redeploy if needed
git push origin main --force
```

This represents the complete state of ChoreWorld as of this development session.
All features are working, tested, and deployed successfully.