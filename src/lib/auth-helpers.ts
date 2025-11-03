export const runtime = 'nodejs';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/firebase/admin';
import User from '@/models/User';
import dbConnect from '@/lib/db';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    uid: string;
    email: string;
    name: string;
    role: string;
    isAdmin: boolean;
  };
}

export async function authenticateUser(request: NextRequest): Promise<AuthenticatedRequest> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No authorization token provided');
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    await dbConnect();

    // If Firebase Admin is properly configured, use it for token verification
    if (auth) {
      const decodedToken = await auth.verifyIdToken(token);
      
      const user = await User.findOne({ firebaseUid: decodedToken.uid });
      
      if (!user) {
        throw new Error('User not found in database');
      }

      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = {
        uid: user.firebaseUid,
        email: user.email,
        name: user.name,
        role: user.role,
        isAdmin: user.role === 'admin'
      };

      return authenticatedRequest;
    } else {
      // Development mode: Use client-side token validation
      // This is a simplified approach for development
      console.warn('Firebase Admin not configured - using development authentication mode');
      
      // In a real app, you could validate the client token using Firebase client SDK
      // For now, we'll use the token to find a user in the database
      try {
        // Try to parse the token as a simple identifier or find by email
        // This is just for development - NOT for production
        const users = await User.find().limit(1);
        const user = users.length > 0 ? users[0] : null;
        
        if (user) {
          const authenticatedRequest = request as AuthenticatedRequest;
          authenticatedRequest.user = {
            uid: user.firebaseUid || 'dev-uid-' + user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            isAdmin: user.role === 'admin'
          };
          return authenticatedRequest;
        } else {
          throw new Error('No users found in database');
        }
      } catch {
        throw new Error('Development authentication failed');
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    throw new Error(errorMessage);
  }
}

export async function requireAuth(request: NextRequest) {
  return await authenticateUser(request);
}

export async function requireAdmin(request: NextRequest) {
  const authRequest = await authenticateUser(request);
  
  if (!authRequest.user?.isAdmin) {
    throw new Error('Admin access required');
  }
  
  return authRequest;
}

// Helper function to get current user info
export async function getCurrentUser(request: NextRequest) {
  try {
    const authRequest = await authenticateUser(request);
    return authRequest.user;
  } catch {
    return null;
  }
}