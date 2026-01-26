import React, { createContext, useContext, useState } from 'react';
import { AuthContextType, ExtendedUser } from '@/types/auth';
import { useAuthState } from '@/hooks/useAuthState';
import { authService } from '@/services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('AuthProvider: Initializing...');

  const { user, isLoading, resetUserState } = useAuthState();
  const [authLoading, setAuthLoading] = useState(false);

  console.log('AuthProvider: State -', { user: !!user, isLoading, authLoading });

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

  // Create extended user with subscription info (default to free tier)
  const extendedUser: ExtendedUser | null = user ? {
    ...user,
    subscriptionTier: 'free',
    subscriptionActive: true
  } as ExtendedUser : null;

  return (
    <AuthContext.Provider value={{
      user: extendedUser,
      loading: combinedLoading,
      isLoading: combinedLoading, // Alias for compatibility
      isAuthenticated: !!user,
      session: user, // For compatibility - the user object acts as the session
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
