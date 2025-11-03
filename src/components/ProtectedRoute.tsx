'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/app/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  redirectTo?: string;
}

export default function ProtectedRoute({ 
  children, 
  requireAdmin = false, 
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const user = useSelector((state: RootState) => state.user);
  const router = useRouter();

  useEffect(() => {
    // Only redirect if auth is not loading and user is not logged in
    if (!user.authLoading && !user.isLoggedIn) {
      console.log('🔄 Redirecting to login - user not authenticated');
      router.push(redirectTo);
      return;
    }
    
    // If admin is required but user is not admin, redirect to home
    if (!user.authLoading && requireAdmin && user.isLoggedIn && user.role !== 'admin') {
      console.log('🔄 Redirecting to home - admin required but user is not admin');
      router.push('/');
      return;
    }
  }, [user.authLoading, user.isLoggedIn, user.role, requireAdmin, redirectTo, router]);

  // Show loading spinner while Firebase auth is initializing
  if (user.authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold">Loading...</h1>
          <p className="text-gray-600">Checking authentication status</p>
        </div>
      </div>
    );
  }

  // If user is not logged in, don't render children (will redirect)
  if (!user.isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Redirecting to login...</h1>
        </div>
      </div>
    );
  }

  // If admin is required but user is not admin
  if (requireAdmin && user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  // User is authenticated and authorized, render the protected content
  return <>{children}</>;
}