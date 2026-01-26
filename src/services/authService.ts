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
      console.log('authService.login success', { uid: result.user.uid, email: result.user.email });
      return {};
    } catch (error: any) {
      console.error('authService.login error', error);
      console.error('Error code:', error.code);

      // Provide user-friendly error messages
      let errorMessage = error.message;
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      }

      return { error: errorMessage };
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
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      console.log('authService.signInWithGoogle: Starting popup...');
      const result = await signInWithPopup(auth, provider);
      console.log('authService.signInWithGoogle success', { uid: result.user.uid, email: result.user.email });
      return {};
    } catch (error: any) {
      console.error('Google sign-in exception:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);

      // Provide user-friendly error messages
      let errorMessage = 'An unexpected error occurred';
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in was cancelled';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked. Please allow popups for this site.';
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'This domain is not authorized for sign-in. Please contact support.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return { error: errorMessage };
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
