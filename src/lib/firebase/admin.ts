import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
export const runtime = 'nodejs';

// Get service account credentials from environment variable or JSON file
function getServiceAccount(): admin.ServiceAccount {
  // Method 1: Try environment variable (for Vercel/production)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) as admin.ServiceAccount;
    } catch (error) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT from environment:', error);
    }
  }

  // Method 2: Try individual environment variables (alternative method)
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    return {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || '',
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID || '',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: '',
      universe_domain: 'googleapis.com'
    } as admin.ServiceAccount;
  }

  // Method 3: Try to load from JSON file (for local development)
  // Only try this if we're not in a build environment (Vercel)
  if (typeof window === 'undefined' && !process.env.VERCEL) {
    try {
      const jsonPath = path.join(process.cwd(), 'src', 'lib', 'firebase', 'Jacobs.json');
      if (fs.existsSync(jsonPath)) {
        const fileContent = fs.readFileSync(jsonPath, 'utf8');
        return JSON.parse(fileContent) as admin.ServiceAccount;
      }
    } catch {
      // File doesn't exist or can't be loaded - this is okay
    }
  }

  throw new Error(
    'Firebase Admin initialization failed. ' +
    'Please provide FIREBASE_SERVICE_ACCOUNT environment variable or Jacobs.json file. ' +
    'See FIREBASE_SETUP.md for instructions.'
  );
}

// Initialize Firebase Admin only once
if (!admin.apps.length) {
  try {
    const serviceAccount = getServiceAccount();
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error);
    throw error;
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