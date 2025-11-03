# Firebase Authentication Setup Guide

## 🔥 Firebase Service Account Configuration

This project supports multiple methods for configuring Firebase Admin SDK:

### Method 1: JSON File (Recommended)

1. **Download your Firebase service account key:**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select your project (`jacob-s-website`)
   - Go to **Project Settings** → **Service Accounts**
   - Click **Generate New Private Key**
   - Download the JSON file

2. **Set up the service account:**
   ```bash
   # Copy the downloaded file to your project root
   cp path/to/your/downloaded-file.json firebase-service-account.json
   ```

3. **The file should look like this:**
   ```json
   {
     "type": "service_account",
     "project_id": "jacob-s-website",
     "private_key_id": "...",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
     "client_email": "firebase-adminsdk-xxxxx@jacob-s-website.iam.gserviceaccount.com",
     "client_id": "...",
     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
     "token_uri": "https://oauth2.googleapis.com/token",
     "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
     "client_x509_cert_url": "...",
     "universe_domain": "googleapis.com"
   }
   ```

### Method 2: Environment Variable

Add to your `.env.local`:
```bash
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"jacob-s-website",...}'
```

### Method 3: Individual Environment Variables (Legacy)

```bash
FIREBASE_PROJECT_ID=jacob-s-website
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@jacob-s-website.iam.gserviceaccount.com
```

## 🛡️ Security Notes

- **Never commit** `firebase-service-account.json` to version control
- The file is already added to `.gitignore`
- In production, use environment variables or secure secret management
- For development, the JSON file method is most convenient

## 🚀 Development vs Production

### Development Mode
- If no service account is found, the app runs in development mode
- Uses Firebase client-side authentication with database fallback
- Shows warnings but continues to function

### Production Mode  
- Requires proper Firebase Admin SDK configuration
- Validates tokens server-side for maximum security
- Full authentication middleware protection

## ✅ Testing the Setup

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Check the console output:**
   - ✅ `Firebase Admin: Successfully initialized` (with service account)
   - ⚠️ `Firebase Admin: No valid service account found - running in development mode`

3. **Test authentication:**
   - Visit `/signup` to create an account
   - Visit `/login` to sign in
   - Visit `/dashboard` to see user data
   - Visit `/admin` to test admin access (change user role to 'admin' in database)

## 🔧 Troubleshooting

### Common Issues:

1. **"Service account object must contain..." error**
   - Check your JSON file format
   - Ensure all required fields are present
   - Verify file path is correct

2. **"Request failed with status code 500" in AuthContext**
   - This is now handled gracefully with fallback authentication
   - Check browser console for detailed error messages

3. **Authentication middleware fails**
   - App will fall back to development mode
   - Check Firebase Admin initialization logs

### Environment Setup:

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Add your Firebase service account
# (Download from Firebase Console)

# Start development server
npm run dev
```

## 📁 File Structure

```
├── firebase-service-account.json          # Your service account (DO NOT COMMIT)
├── firebase-service-account.example.json  # Template file
├── src/
│   ├── lib/
│   │   ├── firebase/
│   │   │   ├── admin.ts               # Admin SDK configuration
│   │   │   └── config.ts              # Client SDK configuration
│   │   └── auth/
│   │       ├── middleware.ts          # Server-side auth middleware
│   │       └── AuthContext.tsx        # Client-side auth context
│   └── app/
│       └── api/
│           └── auth/
│               ├── me/route.ts        # Get current user
│               ├── register/route.ts  # User registration
│               └── create-user/route.ts # Fallback user creation
```

This setup provides a robust, production-ready authentication system with graceful fallbacks for development! 🎉