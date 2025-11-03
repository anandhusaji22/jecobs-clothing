'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/app/store';

export const useAuthGuard = () => {
  const user = useSelector((state: RootState) => state.user);

  return {
    isAuthenticated: user.isLoggedIn,
    isAdmin: user.role === 'admin',
    user,
    // Helper functions
    requireAuth: () => user.isLoggedIn,
    requireAdmin: () => user.isLoggedIn && user.role === 'admin',
  };
};