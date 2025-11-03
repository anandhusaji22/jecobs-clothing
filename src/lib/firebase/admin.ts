import admin from 'firebase-admin';
export const runtime = 'nodejs';

// Get service account from environment variables or JSON file (for local dev)
function getServiceAccount(): admin.ServiceAccount {
  // Try environment variables first (for production/Vercel)
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_CLIENT_EMAIL
  ) {
    return {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
      token_uri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
      universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN || 'googleapis.com',
    } as admin.ServiceAccount;
  }

  // Fallback to JSON file for local development
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const serviceAccount = require('./Jacobs.json');
    return serviceAccount as admin.ServiceAccount;
  } catch (error) {
    throw new Error(
      'Firebase Admin credentials not found. Please set environment variables or provide Jacobs.json file for local development.'
    );
  }
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
    throw new Error('Firebase Admin initialization failed. Check your environment variables or Jacobs.json file.');
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