'use client'

import { Provider } from 'react-redux'
import { store } from '@/app/store'
import React, { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { setUser, clearUser } from '@/slices/userSlice'
import axios from 'axios'

interface ClientProvidersProps {
  children: React.ReactNode
}

// AuthListener component to handle Firebase auth state changes
function AuthListener({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      
      if (firebaseUser) {
        try {
          // Get or refresh Firebase token
          const token = await firebaseUser.getIdToken(true); // Force refresh
          localStorage.setItem('firebaseToken', token);
          
          // Fetch complete user data using /api/auth/me endpoint with token verification
          const response = await axios.get('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.data) {
            const userData = {
              uid: response.data.uid || firebaseUser.uid,
              name: response.data.name || firebaseUser.displayName || '',
              email: response.data.email || firebaseUser.email || '',
              phoneNumber: response.data.phoneNumber || '',
              role: response.data.role || 'customer',
              photoURL: firebaseUser.photoURL || '',
              denomination: response.data.denomination || '',
              isPhoneVerified: response.data.isPhoneVerified || false,
              isEmailVerified: firebaseUser.emailVerified,
              provider: response.data.provider || 'email',
              createdAt: response.data.createdAt || new Date().toISOString(),
            };
            
            store.dispatch(setUser(userData));
          } else {
            store.dispatch(clearUser());
          }
        } catch {
          // Clear user state on any error
          store.dispatch(clearUser());
        }
      } else {
        // No Firebase user, clear Redux state and localStorage
        localStorage.removeItem('firebaseToken');
        store.dispatch(clearUser());
      }
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  return <>{children}</>;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <Provider store={store}>
      <AuthListener>
        {children}
      </AuthListener>
    </Provider>
  )
}
