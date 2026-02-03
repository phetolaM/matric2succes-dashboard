# Deployment Guide for matric2succes Dashboard

This guide will help you deploy the matric2succes dashboard to GitHub and Vercel.

## Prerequisites

- GitHub account
- Vercel account (free tier available)
- MongoDB Atlas account (or self-hosted MongoDB)
- Supabase account

## Step 1: Push to GitHub

### 1.1 Initialize Git Repository (if not already done)

```bash
git init
git add .
git commit -m "Initial commit: matric2succes dashboard"
```

### 1.2 Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Name your repository: `matric2succes-dashboard`
3. Keep it **private** (recommended)
4. Click "Create repository"

### 1.3 Add Remote and Push

```bash
git remote add origin https://github.com/YOUR_USERNAME/matric2succes-dashboard.git
git branch -M main
git push -u origin main
```

## Step 2: Configure Environment Variables

### 2.1 Local Development (.env.local)

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:

- MongoDB connection string
- Supabase credentials
- JWT secret
- SMTP credentials (optional)

**Important**: Never commit `.env.local` to GitHub. It's already in `.gitignore`.

## Step 3: Deploy to Vercel

### 3.1 Connect Vercel to GitHub

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Click "Import Git Repository"
4. Select your `matric2succes-dashboard` repository
5. Click "Import"

### 3.2 Configure Build Settings

**Root Directory**: Leave as default (.)

**Framework Preset**: Next.js (auto-detected)

**Build & Development Settings**: Use defaults

### 3.3 Add Environment Variables

In the "Environment Variables" section, add all your secrets:

```
MONGODB_URI = your_mongodb_connection_string
MONGODB_ADMIN_DB = admin_db_name
MONGODB_EMAIL_DB = email_db_name
MONGODB_NEWSLETTER_DB = newsletter_db_name
MONGODB_UNIVERSITY_DB = university_db_name
NEXT_PUBLIC_SUPABASE_URL = your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY = your_anon_key
JWT_SECRET = your_jwt_secret
SMTP_HOST = (optional)
SMTP_PORT = (optional)
SMTP_USER = (optional)
SMTP_PASS = (optional)
```

**Production Environment**: Make sure to add these for production deployment

### 3.4 Deploy

Click "Deploy" and wait for the build to complete. You'll get a URL like: `https://matric2succes-dashboard.vercel.app`

## Step 4: Set Up GitHub Actions (Optional)

The `.github/workflows/deploy.yml` file enables automatic deployment to Vercel on push.

### 4.1 Get Vercel Tokens

1. Go to [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Create a new token and copy it

### 4.2 Add GitHub Secrets

1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Add the following secrets:

```
VERCEL_TOKEN = (from Vercel)
VERCEL_ORG_ID = (from Vercel account settings)
VERCEL_PROJECT_ID = (from Vercel project settings)
MONGODB_URI = (your MongoDB connection)
JWT_SECRET = (your JWT secret)
NEXT_PUBLIC_SUPABASE_URL = (your Supabase URL)
NEXT_PUBLIC_SUPABASE_ANON_KEY = (your Supabase key)
```

## Step 5: Verify Deployment

### 5.1 Test the Live Site

1. Visit your Vercel URL
2. Test login functionality
3. Test course collection navigation
4. Check API endpoints in browser console

### 5.2 Check Logs

**Vercel Logs**: Dashboard → Deployments → Click latest deployment → View logs

**Build Issues**: Look for MongoDB connection errors, missing env vars, etc.

## Step 6: Custom Domain (Optional)

### 6.1 Add Domain in Vercel

1. Go to your Vercel project → Settings → Domains
2. Enter your custom domain
3. Add DNS records according to Vercel's instructions

## Troubleshooting

### Build fails with "Cannot find module"

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json .next
npm install
npm run build
```

### MongoDB connection timeout

- Verify MongoDB URI is correct
- Add your Vercel IP to MongoDB Atlas whitelist: `0.0.0.0/0` (less secure) or get Vercel's IP range
- Check MongoDB Atlas connection limits

### Missing environment variables

1. Verify all env vars are added in Vercel dashboard
2. Redeploy after adding new environment variables
3. Check `.env.example` for complete list

### API routes returning 500 errors

- Check Vercel logs for error messages
- Verify MongoDB is running
- Check JWT_SECRET is set
- Verify Supabase credentials

## Rollback to Previous Deployment

In Vercel dashboard:

1. Go to Deployments tab
2. Click the three dots on previous deployment
3. Select "Promote to Production"

## Update After Deployment

To make updates:

```bash
# Make changes locally
git add .
git commit -m "Update: description of changes"
git push origin main

# Vercel automatically rebuilds and deploys
```

## Monitoring & Maintenance

- Monitor Vercel dashboard for failed deployments
- Set up alerts for deployment failures
- Check MongoDB Atlas for connection issues
- Review API logs regularly

## Security Checklist

- ✅ All secrets in Vercel environment variables
- ✅ `.env.local` in `.gitignore`
- ✅ GitHub repository is private
- ✅ JWT_SECRET is strong and unique
- ✅ MongoDB has password authentication enabled
- ✅ Supabase access keys are restricted
- ✅ CORS properly configured

## Next Steps

1. Set up monitoring (e.g., Sentry for error tracking)
2. Configure email notifications
3. Set up automated backups for MongoDB
4. Create a staging environment on Vercel
5. Implement CI/CD pipeline for testing

## Support

For deployment issues:

- Check [Vercel Documentation](https://vercel.com/docs)
- Check [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- Review GitHub Actions logs
