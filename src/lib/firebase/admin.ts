import admin from 'firebase-admin';
import serviceAccount from './Jacobs.json';
export const runtime = 'nodejs';

// Initialize Firebase Admin only once
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
    });
    
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error);
    throw new Error('Firebase Admin initialization failed. Make sure Jacobs.json exists and is valid.');
  }
}

// Export Firebase services
export const db = admin.firestore();
export const auth = admin.auth();

// Helper function to verify Firebase ID tokens
export async function verifyIdToken(token: string) {
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying token:', error);
    throw new Error('Invalid or expired token');
  }
}

export default admin;