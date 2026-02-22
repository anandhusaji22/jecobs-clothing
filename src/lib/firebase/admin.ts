import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
export const runtime = 'nodejs';

// Get service account credentials from environment variable or JSON file
function getServiceAccount(): admin.ServiceAccount | null {
  // During build phase, environment variables might not be available
  // Return null and let initialization handle it gracefully
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build' || 
                       process.env.NEXT_PHASE === 'phase-development-build';
  
  // Method 1: Try environment variable (for Vercel/production)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      // Parse as plain object (Firebase JSON uses snake_case e.g. private_key)
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) as Record<string, unknown> & { private_key?: string };
      if (parsed.private_key && typeof parsed.private_key === 'string') {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
      }
      return parsed as admin.ServiceAccount;
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

  // During build, return null instead of throwing
  if (isBuildPhase) {
    return null;
  }

  // At runtime, throw error if credentials not found
  throw new Error(
    'Firebase Admin initialization failed. ' +
    'Please provide FIREBASE_SERVICE_ACCOUNT environment variable or Jacobs.json file. ' +
    'See FIREBASE_SETUP.md for instructions.'
  );
}

// Lazy initialization - only initialize when actually needed
let initialized = false;
let dbInstance: admin.firestore.Firestore | null = null;
let authInstance: admin.auth.Auth | null = null;

function initializeFirebaseAdmin() {
  if (!admin.apps.length && !initialized) {
    try {
      const serviceAccount = getServiceAccount();
      
      // During build, serviceAccount might be null - that's okay
      if (!serviceAccount) {
        console.warn('⚠️ Firebase Admin not initialized during build - will retry at runtime');
        return;
      }
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      
      initialized = true;
      dbInstance = admin.firestore();
      authInstance = admin.auth();
      console.log('✅ Firebase Admin initialized successfully');
    } catch (error) {
      // During build phase, environment variables might not be available
      // Don't throw - allow build to continue. Will re-try at runtime.
      if (process.env.NEXT_PHASE === 'phase-production-build' || 
          process.env.NEXT_PHASE === 'phase-development-build') {
        console.warn('⚠️ Firebase Admin not initialized during build - will retry at runtime');
        return;
      }
      // At runtime, log but don't throw immediately - let individual calls handle it
      console.error('❌ Firebase Admin initialization failed:', error);
      console.warn('⚠️ Firebase Admin not initialized - some features may not work');
    }
  }
}

// Lazy getters for Firebase services
function getDb() {
  initializeFirebaseAdmin();
  if (!dbInstance) {
    throw new Error('Firebase Admin not initialized. Please check FIREBASE_SERVICE_ACCOUNT environment variable.');
  }
  return dbInstance;
}

function getAuth() {
  initializeFirebaseAdmin();
  if (!authInstance) {
    throw new Error('Firebase Admin not initialized. Please check FIREBASE_SERVICE_ACCOUNT environment variable.');
  }
  return authInstance;
}

// Export Firebase services with lazy initialization
export const db = {
  collection: (path: string) => getDb().collection(path),
  doc: (path: string) => getDb().doc(path),
  batch: () => getDb().batch(),
  settings: (settings: admin.firestore.Settings) => getDb().settings(settings),
  // Add other methods as needed
} as admin.firestore.Firestore;

export const auth = {
  verifyIdToken: (idToken: string) => getAuth().verifyIdToken(idToken),
  getUser: (uid: string) => getAuth().getUser(uid),
  getUserByEmail: (email: string) => getAuth().getUserByEmail(email),
  createUser: (properties: admin.auth.CreateRequest) => getAuth().createUser(properties),
  updateUser: (uid: string, properties: admin.auth.UpdateRequest) => getAuth().updateUser(uid, properties),
  deleteUser: (uid: string) => getAuth().deleteUser(uid),
  // Add other methods as needed
} as admin.auth.Auth;

// Helper for forgot-password / reset-password (call getAuth() directly to avoid export/cache issues)
export async function getUserByEmail(email: string) {
  return getAuth().getUserByEmail(email);
}

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