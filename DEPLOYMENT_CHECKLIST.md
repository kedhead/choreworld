# 🚀 ChoreWorld Deployment Checklist

## Backend Deployment (Step 1)

### Railway Option:
- [ ] Sign up at railway.app
- [ ] Create new project from GitHub repo
- [ ] Set environment variables:
  - [ ] NODE_ENV = production
  - [ ] JWT_SECRET = choreworld-super-secret-production-key-2025
- [ ] Copy your Railway URL (e.g., https://choreworld-production.up.railway.app)

### Render Option:
- [ ] Sign up at render.com  
- [ ] Create new web service from GitHub repo
- [ ] Set environment variables:
  - [ ] NODE_ENV = production
  - [ ] JWT_SECRET = choreworld-super-secret-production-key-2025
- [ ] Copy your Render URL (e.g., https://choreworld-api.onrender.com)

## Frontend Configuration (Step 2)

- [ ] Update client/src/config/api.js with your backend URL
- [ ] Commit and push changes to GitHub

## Frontend Deployment (Step 3)

### Netlify Deployment:
- [ ] Sign up at netlify.com
- [ ] Connect GitHub repo: kedhead/choreworld
- [ ] Configure build settings:
  - [ ] Base directory: client
  - [ ] Build command: npm run build  
  - [ ] Publish directory: client/dist
- [ ] Set environment variable:
  - [ ] VITE_API_URL = [your backend URL]
- [ ] Deploy site
- [ ] Copy your Netlify URL

## Testing (Step 4)

- [ ] Visit your Netlify URL
- [ ] Test login with admin/admin123
- [ ] Create a test user
- [ ] Add some chores
- [ ] Test chore assignment and completion
- [ ] Check weekly summary
- [ ] Test on mobile device

## Production Settings (Step 5)

- [ ] Update JWT_SECRET to a strong production key
- [ ] Configure custom domain (optional)
- [ ] Set up SSL certificate (Netlify auto-provides)
- [ ] Configure any additional security headers

## Success! 🎉

Your ChoreWorld app should now be live at:
- Frontend: https://your-app.netlify.app
- Backend: https://your-api.railway.app or .onrender.com

Default login: admin / admin123