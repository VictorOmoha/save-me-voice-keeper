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


const getAuthErrorInfo = (error: unknown): { code?: string; message: string } => {
  if (error instanceof Error) {
    const code = 'code' in error ? (error as { code?: string }).code : undefined;
    return { code, message: error.message };
  }
  return { message: String(error) };
};

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

      // Provide user-friendly error messages
      let errorMessage = 'An unexpected error occurred';
      if (code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in was cancelled';
      } else if (code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked. Please allow popups for this site.';
      } else if (code === 'auth/unauthorized-domain') {
        errorMessage = 'This domain is not authorized for sign-in. Please contact support.';
      } else if (message) {
        errorMessage = message;
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
    } catch (error) {
      const { message } = getAuthErrorInfo(error);
      return { error: message };
    }
  },
};
