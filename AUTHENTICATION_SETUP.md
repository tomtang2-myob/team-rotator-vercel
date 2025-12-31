# Authentication Setup Guide

This guide explains how to set up and use the authentication system that has been added to your Team Rotator application.

## 🔐 Overview

The authentication system protects your entire application with a simple username/password login. It uses:

- **JWT tokens** for session management
- **HTTP-only cookies** for security
- **Layout-based protection** for route protection
- **Environment variables** for credentials

## 📋 Setup Instructions

### 1. Add Environment Variables

Add these variables to your `.env.local` file:

```bash
# Authentication Credentials
AUTH_USERNAME=your-username-here
AUTH_PASSWORD=your-secure-password-here

# JWT Secret (generate a random string for production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-make-it-long-and-random
```

**⚠️ Important Security Notes:**

- The `JWT_SECRET` should be a long, random string
- Generate a secure secret using: `openssl rand -base64 32`
- Never commit real credentials to git
- Use different secrets for development and production

### 2. Add to Vercel (Production)

When deploying to Vercel, add the same environment variables:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add all three variables:
   - `AUTH_USERNAME` = (your chosen username)
   - `AUTH_PASSWORD` = (your secure password)
   - `JWT_SECRET` = (your generated secret)

5. Redeploy your application

## 🚀 How It Works

### Login Flow

1. User visits any page (e.g., `https://your-app.vercel.app/`)
2. Layout checks for authentication via `/api/auth/verify`
3. If not authenticated → Redirect to `/login`
4. User enters username and password
5. Credentials validated against environment variables
6. If valid → JWT token created and stored in HTTP-only cookie
7. User redirected to the original page they requested

### Logout Flow

1. User clicks "Logout" button (in app bar or sidebar)
2. Authentication cookie is cleared
3. User redirected to `/login`

### Protected Routes

All routes are protected **except**:

- `/login` - Login page
- `/api/auth/*` - Auth API endpoints
- `/api/cron` - Cron job endpoint (for Vercel automation)

## 🛠️ Files

| File | Purpose |
|------|---------|
| `src/app/login/page.tsx` | Login page UI with username/password form |
| `src/lib/auth.ts` | Authentication utilities (JWT, cookies, validation) |
| `src/app/api/auth/login/route.ts` | Login API endpoint |
| `src/app/api/auth/logout/route.ts` | Logout API endpoint |
| `src/app/api/auth/verify/route.ts` | Token verification endpoint |
| `src/app/layout.tsx` | Layout with auth check and logout button |

## 🧪 Testing

### Local Testing

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Visit `http://localhost:3000`
3. You should be redirected to `/login`
4. Enter the credentials you set in `.env.local`:
   - **Username**: (your AUTH_USERNAME value)
   - **Password**: (your AUTH_PASSWORD value)
5. Click "Sign In"
6. You should be redirected to the dashboard

### Testing Logout

1. While logged in, click the "Logout" button (top right or sidebar)
2. You should be redirected to `/login`
3. Try accessing any protected page → Should redirect to login

## 🔒 Security Features

✅ **HTTP-only cookies** - JavaScript cannot access the token  
✅ **Secure flag in production** - Cookie only sent over HTTPS  
✅ **SameSite protection** - Prevents CSRF attacks  
✅ **JWT expiration** - Tokens expire after 30 days  
✅ **Environment-based credentials** - No hardcoded passwords  
✅ **Password verification** - Simple but secure validation  

## 📝 Customization

### Changing Credentials

Update the environment variables in `.env.local` and Vercel with your desired credentials.

**Important:** Choose strong, unique credentials for production use.

### Changing Session Duration

Edit `src/lib/auth.ts`:

```typescript
// Default: 30 days
const TOKEN_EXPIRATION = 30 * 24 * 60 * 60;

// Change to 7 days:
const TOKEN_EXPIRATION = 7 * 24 * 60 * 60;

// Change to 1 day:
const TOKEN_EXPIRATION = 1 * 24 * 60 * 60;
```

### Adding Multiple Users

For multiple users, you would need to:

1. Create a database table for users
2. Hash passwords with bcrypt
3. Update `validateCredentials()` in `src/lib/auth.ts` to check database
4. Add user registration functionality

## 🐛 Troubleshooting

### "Invalid username or password" Error

- Check that `.env.local` has the correct values
- Ensure no extra spaces in environment variables
- Restart the dev server after changing `.env.local`

### Redirect Loop

- Clear your browser cookies for `localhost:3000`
- Verify JWT_SECRET is set

### Still Can Access Without Login

- Check that `src/app/layout.tsx` has the authentication check
- Verify `/api/auth/verify` endpoint is working
- Check browser console for errors

### Cron Job Not Working

The `/api/cron` endpoint is excluded from authentication so Vercel can trigger it automatically. If you need to secure it:

1. Use Vercel's cron secret verification
2. Or check for specific headers/IP addresses
3. Documentation: https://vercel.com/docs/cron-jobs

## 🎯 Best Practices

### For Production

1. **Use strong JWT secret**: Generate with `openssl rand -base64 32`
2. **Use strong credentials**: Choose complex usernames and passwords
3. **Use environment variables**: Never hardcode credentials
4. **Monitor failed login attempts**: Add rate limiting if needed
5. **Regular credential rotation**: Change passwords periodically

### For Team Access

If multiple people need access:

- Use a shared password manager (1Password, LastPass)
- Rotate credentials when team members leave
- Consider implementing role-based access control (RBAC) for larger teams

## 📚 Technical Details

### JWT Token Structure

```json
{
  "username": "your-username",
  "iat": 1704067200,  // Issued at (timestamp)
  "exp": 1706659200   // Expires at (timestamp + 30 days)
}
```

### Cookie Configuration

```typescript
{
  name: 'auth-token',
  httpOnly: true,                           // Prevents XSS
  secure: process.env.NODE_ENV === 'production',  // HTTPS only in prod
  sameSite: 'lax',                          // CSRF protection
  maxAge: 30 * 24 * 60 * 60,               // 30 days
  path: '/',                                // Available on all routes
}
```

### Authentication Flow

```
Request → layout.tsx
  ↓
  Is path /login?
  ├─ Yes → Show login page
  └─ No → Call /api/auth/verify
      ↓
      Has valid token?
      ├─ Yes → Show page content
      └─ No → Redirect to /login
```

## 🔗 Related Documentation

- [Next.js App Router](https://nextjs.org/docs/app/building-your-application/routing)
- [JWT (jose library)](https://github.com/panva/jose)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

## ✅ Checklist

Before deploying to production:

- [ ] Add `AUTH_USERNAME` to `.env.local` and Vercel
- [ ] Add `AUTH_PASSWORD` to `.env.local` and Vercel
- [ ] Generate and add `JWT_SECRET` to `.env.local` and Vercel
- [ ] Test login/logout locally
- [ ] Deploy to Vercel
- [ ] Test login/logout on production
- [ ] Verify cron job still works
- [ ] Document credentials in secure location (password manager)

---

## 🆘 Need Help?

If you encounter issues:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review server logs in Vercel Dashboard → Logs
3. Check browser console for errors
4. Verify all environment variables are set correctly
