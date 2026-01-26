import { auth } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

export const authService = {
  login: async (email: string, password: string): Promise<{ error?: string }> => {
    console.log('authService.login called', { email });
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('authService.login success', { uid: result.user.uid });
      return {};
    } catch (error: any) {
      console.error('authService.login error', error);
      return { error: error.message };
    }
  },

  signup: async (email: string, password: string, fullName: string): Promise<{ error?: string }> => {
    console.log('authService.signup called', { email });
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Update profile with full name
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: fullName
        });
      }
      console.log('authService.signup success', { uid: userCredential.user.uid });
      return {};
    } catch (error: any) {
      console.error('authService.signup error', error);
      return { error: error.message };
    }
  },

  signInWithGoogle: async (): Promise<{ error?: string }> => {
    console.log('authService.signInWithGoogle called');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log('authService.signInWithGoogle success', { uid: result.user.uid });
      return {};
    } catch (error: any) {
      console.error('Google sign-in exception:', error);
      return { error: error.message || 'An unexpected error occurred' };
    }
  },

  logout: async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  },

  resetPassword: async (email: string): Promise<{ error?: string }> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  },
};
