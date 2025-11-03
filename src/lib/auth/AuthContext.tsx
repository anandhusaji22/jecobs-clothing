'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { useDispatch } from 'react-redux';
import { setUser, clearUser } from '@/slices/userSlice';
import axios from 'axios';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUserState(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Get user data from database
          const token = await firebaseUser.getIdToken();
          const response = await axios.get('/api/auth/me', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            timeout: 10000, // 10 second timeout
          });
          
          // User exists in database - update Redux with complete profile
          dispatch(setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: response.data.name || firebaseUser.displayName || '',
            role: response.data.role || 'customer',
            photoURL: firebaseUser.photoURL || '',
            phoneNumber: firebaseUser.phoneNumber || '',
            isEmailVerified: firebaseUser.emailVerified,
            provider: response.data.provider || 'email',
            createdAt: response.data.createdAt || new Date().toISOString(),
          }));
          
        } catch (error) {
          console.warn('Failed to fetch user data from database:', error);
          
          // If the API call fails, we still have the Firebase user
          // Set basic user data from Firebase and let them use the app
          dispatch(setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || '',
            role: 'customer', // Default role
            photoURL: firebaseUser.photoURL || '',
            phoneNumber: firebaseUser.phoneNumber || '',
            isEmailVerified: firebaseUser.emailVerified,
            provider: 'email', // Default provider
            createdAt: new Date().toISOString(),
          }));
          
          console.log('Using Firebase user data as fallback');
        }
      } else {
        // User logged out
        dispatch(clearUser());
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [dispatch]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};