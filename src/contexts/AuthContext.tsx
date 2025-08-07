import React, { createContext, useContext, useState } from 'react';
import { AuthContextType } from '@/types/auth';
import { useAuthState } from '@/hooks/useAuthState';
import { authService } from '@/services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('AuthProvider: Initializing...');
  
  const { user, session, isLoading, resetUserState } = useAuthState();
  const [authLoading, setAuthLoading] = useState(false);
  
  console.log('AuthProvider: State -', { user: !!user, session: !!session, isLoading, authLoading });

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

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isAuthenticated: !!session,
      isLoading: isLoading || authLoading,
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