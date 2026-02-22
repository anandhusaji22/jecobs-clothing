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

// Key for persisting email-login user so we can restore after refresh (Firebase has no user for email-login)
const EMAIL_LOGIN_USER_KEY = 'emailLoginUser';

// AuthListener component to handle Firebase auth state changes
function AuthListener({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let pendingClearTimeoutId: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (pendingClearTimeoutId) {
        clearTimeout(pendingClearTimeoutId);
        pendingClearTimeoutId = null;
      }
      if (firebaseUser) {
        // Clear any email-login persistence when signed in with Firebase
        try {
          localStorage.removeItem(EMAIL_LOGIN_USER_KEY);
        } catch {}
        try {
          const token = await firebaseUser.getIdToken(true);
          localStorage.setItem('firebaseToken', token);

          const response = await axios.get('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
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
              isPhoneVerified: response.data.isPhoneVerified ?? false,
              isEmailVerified: firebaseUser.emailVerified,
              provider: response.data.provider || 'email',
              createdAt: response.data.createdAt || new Date().toISOString(),
            };
            store.dispatch(setUser(userData));
          } else {
            store.dispatch(clearUser());
          }
        } catch {
          store.dispatch(clearUser());
        }
      } else {
        // No Firebase user: restore email-login session if present
        const storedToken = typeof window !== 'undefined' ? localStorage.getItem('firebaseToken') : null;
        if (storedToken?.startsWith('email-')) {
          try {
            const userJson = localStorage.getItem(EMAIL_LOGIN_USER_KEY);
            if (userJson) {
              const parsed = JSON.parse(userJson) as {
                uid?: string; name?: string; email?: string; phoneNumber?: string;
                role?: string; photoURL?: string; denomination?: string;
                isPhoneVerified?: boolean; isEmailVerified?: boolean; provider?: string; createdAt?: string;
              };
              if (parsed?.uid) {
                store.dispatch(setUser({
                  uid: parsed.uid,
                  name: parsed.name ?? '',
                  email: parsed.email ?? '',
                  phoneNumber: parsed.phoneNumber ?? '',
                  role: parsed.role ?? 'customer',
                  photoURL: parsed.photoURL ?? '',
                  denomination: parsed.denomination ?? '',
                  isPhoneVerified: parsed.isPhoneVerified ?? false,
                  isEmailVerified: parsed.isEmailVerified ?? false,
                  provider: parsed.provider ?? 'email',
                  createdAt: parsed.createdAt ?? new Date().toISOString(),
                }));
                return;
              }
            }
          } catch {
            // Invalid stored data, fall through to clear
          }
        }
        // Give Firebase a moment to restore from persistence before clearing (avoids logout on refresh for Firebase users)
        const timeoutId = setTimeout(() => {
          if (auth.currentUser) return;
          localStorage.removeItem('firebaseToken');
          try {
            localStorage.removeItem(EMAIL_LOGIN_USER_KEY);
          } catch {}
          store.dispatch(clearUser());
        }, 400);
        pendingClearTimeoutId = timeoutId;
      }
    });

    return () => {
      if (pendingClearTimeoutId != null) clearTimeout(pendingClearTimeoutId);
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
