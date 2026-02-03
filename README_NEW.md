# matric2succes Dashboard

A comprehensive administrative dashboard for managing university course collections, student data, and APS visibility settings. Built with Next.js, React, and MongoDB.

## Features

- 🎓 **Course Management** - Manage courses across multiple South African universities
- 👥 **User Management** - Handle admin users and student records
- 📊 **APS Visibility** - Control university visibility in the APS calculator
- 📧 **Email Management** - Inbox for contact form submissions
- 🏫 **University Forms** - Dedicated forms for various universities (NMU, WSU, etc.)
- 🔐 **Secure Authentication** - Admin login with session management

## Tech Stack

- **Frontend**: Next.js 16, React 19, React Icons
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT, bcryptjs
- **File Storage**: Supabase
- **Styling**: CSS Modules

## Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB instance
- Supabase account (for file storage)

## Environment Variables

Create a `.env.local` file in the project root:

```env
# MongoDB
MONGODB_URI=your_mongodb_connection_string
MONGODB_ADMIN_DB=admin_database_name
MONGODB_EMAIL_DB=email_database_name
MONGODB_NEWSLETTER_DB=newsletter_database_name
MONGODB_UNIVERSITY_DB=university_database_name

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# Email (if using nodemailer)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password

# JWT
JWT_SECRET=your_jwt_secret_key

# General
NODE_ENV=production
```

## Getting Started

### Local Development

1. Clone the repository:

```bash
git clone https://github.com/yourusername/matric2succes-dashboard.git
cd matric2succes-dashboard
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
# Edit .env.local with your actual values
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm run start
```

## Project Structure

```
├── app/
│   ├── admin/              # Admin pages
│   │   ├── course-collection/
│   │   ├── university-forms/
│   │   └── aps-visibility/
│   ├── dashboard/          # Dashboard pages
│   ├── api/                # API routes
│   ├── login/              # Login page
│   └── layout.js           # Root layout
├── lib/
│   ├── models/             # Mongoose models
│   ├── db/                 # Database connections
│   ├── auth/               # Authentication logic
│   └── services/           # External services (Supabase)
├── public/                 # Static assets
└── server/                 # Backend server (if applicable)
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project" and import your GitHub repository
4. Set environment variables in Vercel dashboard
5. Deploy with one click

**Environment Variables in Vercel:**

- Add all `.env.local` variables in the Vercel dashboard under Settings → Environment Variables

### GitHub Pages

This project uses Next.js API routes and dynamic features, so GitHub Pages alone won't work. Use Vercel or another full-stack hosting provider.

### Self-Hosted

1. Build the project:

```bash
npm run build
```

2. Copy the `.next` folder and `public` folder to your server

3. Set environment variables and run:

```bash
npm run start
```

4. Use a process manager like PM2:

```bash
pm2 start npm --name "matric2succes" -- start
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## API Routes

- `POST /api/login` - Admin login
- `POST /api/logout` - Admin logout
- `GET /api/session` - Check session
- `GET/POST /api/course-collections` - Manage courses
- `GET/POST /api/universities` - Manage universities
- `GET/POST /api/user-list` - Manage users
- `GET/POST /api/contact` - Contact form submissions
- `POST /api/upload` - Upload files

## Security Considerations

- ✅ All environment variables are in `.env.local` (not committed)
- ✅ Authentication checks on protected routes
- ✅ JWT tokens for session management
- ✅ Password hashing with bcryptjs
- ✅ CORS and security headers configured

## Troubleshooting

**"Cannot find module" errors:**

```bash
rm -rf node_modules package-lock.json
npm install
```

**Database connection issues:**

- Verify MongoDB URI in `.env.local`
- Check network access in MongoDB Atlas

**Vercel deployment fails:**

- Check build logs in Vercel dashboard
- Ensure all environment variables are set
- Verify Node.js version compatibility

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## License

This project is private and proprietary.

## Support

For issues or questions, please create an issue in the GitHub repository or contact the team.

## Changelog

### Version 0.1.0

- Initial release
- Course collection management
- University forms
- Admin authentication
- Email inbox integration
