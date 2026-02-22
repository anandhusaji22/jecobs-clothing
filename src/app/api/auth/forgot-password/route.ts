import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import OTP from '@/models/OTP';
import User from '@/models/User';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

// Reusable transporter (lazy so env is read at request time)
function getTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) {
    throw new Error('EMAIL_USER and EMAIL_PASS must be set for forgot password.');
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    const emailNormalized = email.trim().toLowerCase();
    if (!emailRegex.test(emailNormalized)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    await connectDB();

    // Use MongoDB as source of truth (same as signup). Avoids Firebase 503.
    const user = await User.findOne({ email: emailNormalized }).lean();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No account found with this email address' },
        { status: 404 }
      );
    }

    // Google-only users don't have a password to reset
    if (user.authProvider === 'google' && !user.password) {
      return NextResponse.json(
        {
          success: false,
          error: 'This account uses Google sign-in. Please use "Continue with Google" to sign in.',
        },
        { status: 400 }
      );
    }

    // Delete existing password-reset OTPs for this email
    await OTP.deleteMany({ email: emailNormalized, purpose: 'password_reset' });

    const otp = generateOTP();
    const newOTP = new OTP({
      email: emailNormalized,
      otp,
      purpose: 'password_reset',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      verified: false,
      attempts: 0,
      maxAttempts: 3,
    });
    await newOTP.save();

    const transporter = getTransporter();
    const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    const mailOptions = {
      from: from || process.env.EMAIL_USER,
      to: emailNormalized,
      subject: "Password Reset OTP - Jacob's Clothing",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset OTP</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background-color: #000; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; }
            .otp-box { background-color: #f9f9f9; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px dashed #ccc; }
            .otp-code { font-size: 32px; font-weight: bold; color: #000; letter-spacing: 8px; }
            .footer { background-color: #f0f0f0; padding: 20px; text-align: center; color: #666; font-size: 12px; }
            .warning { background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hello,</h2>
              <p>We received a request to reset your password for your Jacob's Clothing account.</p>
              <div class="otp-box">
                <p style="margin: 0; font-size: 14px; color: #666;">Your OTP Code:</p>
                <div class="otp-code">${otp}</div>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">This code will expire in 10 minutes</p>
              </div>
              <p>Enter this code on the password reset page to continue. If you didn't request a password reset, please ignore this email.</p>
              <div class="warning">
                <strong>Security Notice:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Never share your OTP with anyone</li>
                  <li>This code is valid for 10 minutes only</li>
                </ul>
              </div>
            </div>
            <div class="footer">
              <p>&copy; 2025 Jacob's Clothing. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      {
        success: true,
        message: 'OTP sent to your email address. Please check your inbox.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in forgot-password API:', error);
    const message = error instanceof Error ? error.message : 'Failed to send OTP. Please try again later.';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
