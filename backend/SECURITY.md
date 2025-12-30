# Security Setup Guide

## ✅ Security Measures Implemented

### 1. Environment Variable Protection
All sensitive credentials are now stored in `.env` files that are **gitignored** and never committed to the repository.

### 2. File Structure

```
.env                    # Root .env for Docker Compose (GITIGNORED)
.env.example           # Example file showing format (committed)
backend/.env           # Backend server credentials (GITIGNORED)
backend/.env.example   # Example file showing format (committed)
.gitignore            # Ensures .env files are never committed
```

### 3. Protected Credentials

**Database Credentials** (in `.env` at project root):
- `POSTGRES_DB` - Database name
- `POSTGRES_USER` - Database username  
- `POSTGRES_PASSWORD` - Database password (NEVER commit this!)

**Backend Credentials** (in `backend/.env`):
- `DATABASE_URL` - Full connection string with password
- Other sensitive configuration

### 4. Git Protection

The `.gitignore` file now includes:
```gitignore
# Environment files - NEVER commit these!
.env
.env.local
.env.*.local
**/.env
**/!.env.example
```

## 🔒 How to Set Up Securely

### For New Developers

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd barvidva-kasetfair
   ```

2. **Copy example files to create your .env**
   ```bash
   # Root .env for Docker Compose
   cp .env.example .env
   
   # Backend .env
   cp backend/.env.example backend/.env
   ```

3. **Set secure passwords**
   Edit both `.env` files and replace `your_secure_password_here` with your own secure passwords.
   
   **IMPORTANT**: Use different passwords for development and production!

4. **Never commit .env files**
   The `.gitignore` is already configured, but always double-check:
   ```bash
   git status  # Should NOT show .env files
   ```

## ⚠️ What NOT To Do

1. ❌ **NEVER** commit `.env` files to git
2. ❌ **NEVER** hardcode passwords in source code
3. ❌ **NEVER** share `.env` files via chat, email, or screenshots
4. ❌ **NEVER** use production credentials in development
5. ❌ **NEVER** commit files with passwords in comments

## ✅ What TO Do

1. ✅ **ALWAYS** use `.env.example` as a template
2. ✅ **ALWAYS** use strong, unique passwords
3. ✅ **ALWAYS** check `git status` before committing
4. ✅ **ALWAYS** use different passwords for dev/staging/production
5. ✅ **ALWAYS** rotate passwords if they're exposed

## 🔄 If Credentials Were Exposed

If you accidentally committed passwords to GitHub:

1. **Immediately change all passwords**
   ```bash
   # Update .env files with new passwords
   # Restart database and backend
   docker-compose down -v
   docker-compose up -d db
   cd backend && ./server
   ```

2. **Use BFG Repo-Cleaner or git-filter-branch**
   This removes sensitive data from git history:
   ```bash
   # Install BFG
   brew install bfg
   
   # Clean the repo (replace with your actual password)
   bfg --replace-text passwords.txt
   
   # Force push (WARNING: Destructive!)
   git push --force
   ```

3. **Notify your team**
   Let everyone know to pull the cleaned history and update their credentials.

## 🔐 Production Deployment

For production environments:

1. **Use environment variables** provided by your hosting platform
   - Fly.io: Use `fly secrets set`
   - Heroku: Use Heroku Config Vars
   - AWS: Use AWS Secrets Manager
   - Docker: Use Docker secrets

2. **Never store production credentials in .env files**
   
3. **Use strong, randomly generated passwords**
   ```bash
   # Generate secure password
   openssl rand -base64 32
   ```

## 📋 Checklist Before Committing

- [ ] Run `git status` - No `.env` files listed
- [ ] Run `git diff` - No passwords in changes
- [ ] `.env.example` files have placeholder passwords only
- [ ] All sensitive config uses environment variables
- [ ] `.gitignore` includes `.env` patterns

## 🆘 Getting Help

If you're unsure about security:
1. Ask a senior developer to review
2. Check this document
3. When in doubt, don't commit!
