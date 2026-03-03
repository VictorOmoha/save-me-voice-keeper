/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';
import { AuthContextType, ExtendedUser } from '@/types/auth';
import { useAuthState } from '@/hooks/useAuthState';
import { authService } from '@/services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading, subscriptionTier, subscriptionActive, resetUserState } = useAuthState();
  const [authLoading, setAuthLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setAuthLoading(true);
    try {
      const result = await authService.login(email, password);
      return result;
    } finally {
      setAuthLoading(false);
    }
  };

  const signup = async (email: string, password: string, fullName: string) => {
    setAuthLoading(true);
    try {
      const result = await authService.signup(email, password, fullName);
      return result;
    } finally {
      setAuthLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    const result = await authService.signInWithGoogle();
    return result;
  };

  const logout = async () => {
    await authService.logout();
    resetUserState();
  };

  const resetPassword = async (email: string) => {
    return await authService.resetPassword(email);
  };

  const combinedLoading = isLoading || authLoading;

  // Create extended user with subscription info from Firestore
  const extendedUser: ExtendedUser | null = user ? {
    ...user,
    subscriptionTier,
    subscriptionActive
  } as ExtendedUser : null;

  return (
    <AuthContext.Provider value={{
      user: extendedUser,
      loading: combinedLoading,
      isLoading: combinedLoading,
      isAuthenticated: !!user,
      session: user,
      login,
      signup,
      signInWithGoogle,
      logout,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
