import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase/admin';
import User from '@/models/User';
import dbConnect from '@/lib/db';

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Connect to database
    await dbConnect();

   
      // Use Firebase Admin to verify token
      
        const decodedToken = await auth.verifyIdToken(token);
        
        // Find user in database
        const user = await User.findOne({ firebaseUid: decodedToken.uid });
        
        if (!user) {
          return NextResponse.json(
            { error: 'User not found in database' },
            { status: 404 }
          );
        }

        // Return user data
        return NextResponse.json({
          uid: user.firebaseUid,
          email: user.email,
          name: user.name,
          role: user.role,
          denomination: user.denomination || '',
          provider: user.authProvider || 'email',
          phoneNumber: user.phoneNumber || '',
          createdAt: user.createdAt,
          isAdmin: user.role === 'admin'
        });
        
      } catch (firebaseError) {
        console.error('Firebase token verification failed:', firebaseError);
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        );
      }
    }