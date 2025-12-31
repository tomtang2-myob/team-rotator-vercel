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

### 🔐 What is JWT_SECRET?

`JWT_SECRET` is a **secret key** used to **sign and verify JSON Web Tokens (JWT)**. Think of it like a special password that only your server knows.

**Purpose:**

1. **Token Signing (Creating Tokens)** - When a user logs in, the server creates a JWT token and signs it with `JWT_SECRET`. This signature proves the token is legitimate and hasn't been tampered with.

2. **Token Verification (Checking Tokens)** - When a user accesses protected pages, the server verifies the token using the same `JWT_SECRET` to ensure it's authentic.

**Security Analogy:**

Think of JWT like a **sealed envelope**:

```
Without JWT_SECRET:
┌─────────────────────────────────┐
│ Username: user123               │
│ Expires: 2025-01-30             │
│ [Anyone can read and modify]    │
└─────────────────────────────────┘
❌ Not secure - anyone can forge tokens!

With JWT_SECRET:
┌─────────────────────────────────┐
│ Username: user123               │
│ Expires: 2025-01-30             │
│ ─────────────────────────────── │
│ Signature: 🔒 (signed with      │
│            JWT_SECRET)           │
└─────────────────────────────────┘
✅ Secure - only your server can create/verify!
```

**Why It's Critical:**

| Without JWT_SECRET | With JWT_SECRET |
|-------------------|-----------------|
| ❌ Anyone could create fake tokens | ✅ Only your server can create valid tokens |
| ❌ Users could modify their tokens | ✅ Tampering is detected immediately |
| ❌ Attackers could impersonate users | ✅ Users can't forge authentication |
| ❌ No way to verify authenticity | ✅ Token integrity is guaranteed |

**Best Practices:**

```bash
# ❌ WEAK - Never use simple secrets
JWT_SECRET=secret123

# ✅ STRONG - Use long, random strings
JWT_SECRET=vK/9xR3nP2mZ8wT5qL1hN4jY7sA0dF3gH6kJ9mN2bV4cX8zS5qW1

# Generate a secure secret:
openssl rand -base64 32
```

**Key Point:** If `JWT_SECRET` is compromised, attackers can forge authentication tokens and impersonate any user. Keep it secret and secure!

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
- Verify JWT_SECRET is set in `.env.local`
- Restart the dev server after adding JWT_SECRET

### Still Can Access Without Login

- Check that `src/app/layout.tsx` has the authentication check
- Verify `/api/auth/verify` endpoint is working
- Check browser console for errors
- Ensure JWT_SECRET matches between login and verification

### Authentication Randomly Fails

- **Problem:** JWT_SECRET might have changed between deployments
- **Solution:** Use the same JWT_SECRET across all environments
- **Check:** Verify JWT_SECRET in Vercel matches your local `.env.local` (for testing)
- **Note:** Changing JWT_SECRET invalidates all existing tokens (users must re-login)

### Users Keep Getting Logged Out

- **Problem:** Token expiration is too short or JWT_SECRET keeps changing
- **Check:** Verify TOKEN_EXPIRATION in `src/lib/auth.ts` (default: 30 days)
- **Check:** Ensure JWT_SECRET is consistent and not changing on each deployment

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

### How JWT_SECRET is Used in Code

**Creating a Token (Login):**

```typescript
// src/lib/auth.ts
export async function createToken(username: string): Promise<string> {
  const secret = getJwtSecret(); // ← Gets JWT_SECRET
  
  const token = await new SignJWT({ username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + TOKEN_EXPIRATION)
    .sign(secret);  // ← Signs token with JWT_SECRET
  
  return token;
}
```

**Verifying a Token (Every Request):**

```typescript
// src/lib/auth.ts
export async function verifyToken(token: string): Promise<{ username: string } | null> {
  try {
    const secret = getJwtSecret(); // ← Gets JWT_SECRET
    const { payload } = await jwtVerify(token, secret); // ← Verifies with JWT_SECRET
    
    return { username: payload.username as string };
  } catch (error) {
    return null; // Invalid token
  }
}
```

**Flow:**

```
1. User Login
   ├─ Validates AUTH_USERNAME & AUTH_PASSWORD
   ├─ Creates JWT token with user data
   ├─ SIGNS token with JWT_SECRET ← Creates signature
   └─ Stores signed token in HTTP-only cookie

2. Accessing Protected Page
   ├─ Browser sends cookie with token
   ├─ Server extracts token from cookie
   ├─ VERIFIES token signature with JWT_SECRET ← Checks authenticity
   ├─ If signature valid → Allow access
   └─ If signature invalid → Redirect to login

3. Security Check
   ├─ Token modified? → Signature won't match → Denied
   ├─ Token expired? → Timestamp check → Denied
   └─ Token valid? → Signature matches → Allowed
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
