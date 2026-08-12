import { User as FirebaseUser } from 'firebase/auth';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  subscriptionTier: 'free' | 'basic' | 'premium';
  subscriptionActive: boolean;
}

// Extended Firebase User with subscription info
export interface ExtendedUser extends FirebaseUser {
  subscriptionTier?: 'free' | 'basic' | 'premium';
  subscriptionActive?: boolean;
}

export interface AuthContextType {
  user: ExtendedUser | null;
  loading: boolean;
  isLoading: boolean; // Alias for loading
  isAuthenticated: boolean;
  session: unknown; // For compatibility - represents the auth session
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string; message?: string }>;
}
