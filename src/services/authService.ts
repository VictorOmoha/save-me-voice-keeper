import { auth } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect
} from 'firebase/auth';
import { getAuthErrorInfo, getGoogleAuthFailureMode } from './authErrors';

export const authService = {
  login: async (email: string, password: string): Promise<{ error?: string }> => {
    console.log('authService.login called', { email });
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('authService.login success', { uid: result.user.uid, email: result.user.email });
      return {};
    } catch (error) {
      const { code, message } = getAuthErrorInfo(error);
      console.error('authService.login error', error);
      console.error('Error code:', code);

      // Provide user-friendly error messages
      let errorMessage = message;
      if (code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format.';
      } else if (code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.';
      } else if (code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (code === 'auth/invalid-credential') {
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
    } catch (error) {
      const { message } = getAuthErrorInfo(error);
      console.error('authService.signup error', error);
      return { error: message };
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
    } catch (error) {
      const { code, message } = getAuthErrorInfo(error);
      console.error('Google sign-in exception:', error);
      console.error('Error code:', code);
      console.error('Error message:', message);

      const failureMode = getGoogleAuthFailureMode(error);
      if (failureMode.shouldTryRedirect) {
        console.warn(failureMode.message);
        try {
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({
            prompt: 'select_account'
          });
          await signInWithRedirect(auth, provider);
          return {};
        } catch (redirectError) {
          const redirectInfo = getAuthErrorInfo(redirectError);
          console.error('Google redirect sign-in exception:', redirectError);
          return { error: redirectInfo.message || failureMode.message };
        }
      }

      return { error: failureMode.message };
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
    } catch (error) {
      const { message } = getAuthErrorInfo(error);
      return { error: message };
    }
  },
};
