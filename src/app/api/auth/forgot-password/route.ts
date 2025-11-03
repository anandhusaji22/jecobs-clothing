import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import OTP from '@/models/OTP';
import nodemailer from 'nodemailer';
import { auth } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

// Create reusable transporter object
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if user exists in Firebase
    let userExists = false;
    try {
      await auth.getUserByEmail(email);
      userExists = true;
    } catch {
      // User not found in Firebase
      return NextResponse.json(
        { success: false, error: 'No account found with this email address' },
        { status: 404 }
      );
    }

    if (!userExists) {
      return NextResponse.json(
        { success: false, error: 'No account found with this email address' },
        { status: 404 }
      );
    }

    // Connect to database
    await connectDB();

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email, purpose: 'password_reset' });

    // Generate new OTP
    const otp = generateOTP();

    // Save OTP to database
    const newOTP = new OTP({
      email,
      otp,
      purpose: 'password_reset',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      verified: false,
      attempts: 0,
      maxAttempts: 3
    });

    await newOTP.save();

    // Send OTP via email
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset OTP - Jacob\'s Clothing',
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
              
              <p>Enter this code on the password reset page to continue. If you didn't request a password reset, please ignore this email or contact our support team if you have concerns.</p>
              
              <div class="warning">
                <strong>Security Notice:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Never share your OTP with anyone</li>
                  <li>Our staff will never ask for your OTP</li>
                  <li>This code is valid for 10 minutes only</li>
                </ul>
              </div>
            </div>
            
            <div class="footer">
              <p>&copy; 2025 Jacob's Clothing. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { 
        success: true, 
        message: 'OTP sent to your email address. Please check your inbox.' 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in forgot-password API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send OTP. Please try again later.' },
      { status: 500 }
    );
  }
}
