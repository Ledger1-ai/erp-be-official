import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { User } from '@/lib/models/User';
import { verifyPassword } from '@/lib/auth/password';
import { generateTokens, generateAccessToken } from '@/lib/auth/jwt';
import { z } from 'zod';
import { isDemoMode } from '@/lib/config/demo';

// Rate limiting storage (in production, use Redis)
const rateLimitMap = new Map<string, { attempts: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  twoFactorToken: z.string().optional(), // For 2FA verification during login
});

function getRateLimitKey(ip: string, email: string): string {
  return `${ip}:${email}`;
}

function checkRateLimit(key: string): { isBlocked: boolean; remainingAttempts: number } {
  const record = rateLimitMap.get(key);
  const now = Date.now();

  if (!record) {
    return { isBlocked: false, remainingAttempts: MAX_ATTEMPTS };
  }

  // Reset if lockout period has passed
  if (now - record.lastAttempt > LOCKOUT_DURATION) {
    rateLimitMap.delete(key);
    return { isBlocked: false, remainingAttempts: MAX_ATTEMPTS };
  }

  const isBlocked = record.attempts >= MAX_ATTEMPTS;
  const remainingAttempts = Math.max(0, MAX_ATTEMPTS - record.attempts);

  return { isBlocked, remainingAttempts };
}

function recordFailedAttempt(key: string): void {
  const record = rateLimitMap.get(key) || { attempts: 0, lastAttempt: 0 };
  record.attempts += 1;
  record.lastAttempt = Date.now();
  rateLimitMap.set(key, record);
}

function clearFailedAttempts(key: string): void {
  rateLimitMap.delete(key);
}

export async function POST(request: NextRequest) {
  try {
    // In demo mode, bypass DB and authenticate any valid email/password
    if (isDemoMode()) {
      const body = await request.json();
      const validation = loginSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json({ success: false, message: 'Invalid input' }, { status: 400 });
      }
      const { email } = validation.data;
      const demoUser = {
        _id: '507f1f77bcf86cd799439011',
        email,
        name: 'Richard L.',
        role: 'Super Admin',
        permissions: ['dashboard','inventory','inventory:financial','team','team:performance','team:management','menu','hostpro','robotic-fleets','settings','analytics','analytics:detailed','roster'],
      } as any;
      const tokens = {
        accessToken: generateAccessToken({ userId: String(demoUser._id), email: demoUser.email, role: demoUser.role, permissions: demoUser.permissions }),
        refreshToken: generateAccessToken({ userId: String(demoUser._id), email: demoUser.email, role: demoUser.role, permissions: demoUser.permissions }),
        user: { id: String(demoUser._id), email: demoUser.email, name: demoUser.name, role: demoUser.role, permissions: demoUser.permissions },
      };
      const response = NextResponse.json({ success: true, message: 'Login successful (demo)', user: tokens.user, accessToken: tokens.accessToken }, { status: 200 });
      response.cookies.set('refreshToken', tokens.refreshToken, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 30 * 24 * 60 * 60, path: '/' });
      return response;
    }

    // Connect to database (non-demo)
    await connectDB();

    // Get client IP (for rate limiting)
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid input',
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, password, twoFactorToken } = validation.data;
    const rateLimitKey = getRateLimitKey(ip, email);

    // Check rate limiting
    const { isBlocked, remainingAttempts } = checkRateLimit(rateLimitKey);
    if (isBlocked) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many failed attempts. Please try again later.',
          retryAfter: Math.ceil(LOCKOUT_DURATION / 1000),
        },
        { status: 429 }
      );
    }

    // Find user with sensitive fields for 2FA verification
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      isActive: true 
    }).select('+password +twoFactorSecret +backupCodes');

    if (!user) {
      recordFailedAttempt(rateLimitKey);
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email or password',
          remainingAttempts: remainingAttempts - 1,
        },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      recordFailedAttempt(rateLimitKey);
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email or password',
          remainingAttempts: remainingAttempts - 1,
        },
        { status: 401 }
      );
    }

    // Check if user needs to change password (first login or forced change)
    const needsPasswordChange = Boolean((user as any).isFirstLogin || (user as any).mustChangePassword);
    if (needsPasswordChange) {
      // Generate a temporary token for password change
      const tempToken = generateAccessToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        permissions: ['password-change'] // Limited permission
      });

      return NextResponse.json(
        {
          success: false,
          requiresPasswordChange: true,
          isFirstLogin: user.isFirstLogin,
          message: user.isFirstLogin 
            ? 'Welcome! Please set your new password to continue.'
            : 'You must change your password before continuing.',
          tempToken
        },
        { status: 200 }
      );
    }

    // Check if 2FA is enabled and handle accordingly
    if (user.twoFactorEnabled) {
      if (!twoFactorToken) {
        // First step: password verified, now need 2FA
        return NextResponse.json(
          {
            success: false,
            requires2FA: true,
            message: 'Please enter your 2FA verification code.',
            // Don't provide any tokens yet
          },
          { status: 200 }
        );
      }

      // Verify 2FA token
      const { verify2FA } = await import('@/lib/auth/2fa');
      const verification = verify2FA(
        twoFactorToken,
        user.twoFactorSecret!,
        user.backupCodes || []
      );

      if (!verification.success) {
        recordFailedAttempt(rateLimitKey);
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid 2FA code',
            remainingAttempts: remainingAttempts - 1,
          },
          { status: 401 }
        );
      }

             // If backup code was used, remove it
       if (verification.isBackupCode && verification.usedBackupCode) {
         if (Array.isArray((user as any).backupCodes)) {
           (user as any).backupCodes = (user as any).backupCodes.filter((c: string) => c !== verification.usedBackupCode);
         }
       }
    }

    // Clear failed attempts on successful login
    clearFailedAttempts(rateLimitKey);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const tokens = await generateTokens(user._id.toString());

    // Set secure httpOnly cookie for refresh token
    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        user: tokens.user,
        accessToken: tokens.accessToken,
      },
      { status: 200 }
    );

    // Set refresh token as httpOnly cookie
    response.cookies.set('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred during login',
      },
      { status: 500 }
    );
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 