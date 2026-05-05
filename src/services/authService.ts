import { auth } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect
} from 'firebase/auth';
import { getAuthErrorInfo, getGoogleAuthFailureMode } from './authErrors';
import { logAuth } from '@/utils/logger';

const RESET_PASSWORD_MESSAGE = 'If an account exists for that email, a password reset link has been sent.';

const getLoginErrorMessage = (code: string, fallback: string): string => {
  if (code === 'auth/invalid-email') {
    return 'Invalid email address format.';
  }

  if (code === 'auth/user-disabled') {
    return 'This account has been disabled.';
  }

  if (code === 'auth/too-many-requests') {
    return 'Too many failed attempts. Please try again later.';
  }

  if (
    code === 'auth/user-not-found' ||
    code === 'auth/wrong-password' ||
    code === 'auth/invalid-credential'
  ) {
    return 'Invalid email or password. Please check your credentials.';
  }

  return fallback;
};

export const authService = {
  login: async (email: string, password: string): Promise<{ error?: string }> => {
    logAuth('login started');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      logAuth('login completed');
      return {};
    } catch (error) {
      const { code, message } = getAuthErrorInfo(error);
      logAuth('login failed', { code });
      return { error: getLoginErrorMessage(code, message) };
    }
  },

  signup: async (email: string, password: string, fullName: string): Promise<{ error?: string }> => {
    logAuth('signup started');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: fullName
        });
        await sendEmailVerification(userCredential.user);
      }

      logAuth('signup completed');
      return {};
    } catch (error) {
      const { code, message } = getAuthErrorInfo(error);
      logAuth('signup failed', { code });
      return { error: message };
    }
  },

  signInWithGoogle: async (): Promise<{ error?: string }> => {
    logAuth('google sign-in started');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      await signInWithPopup(auth, provider);
      logAuth('google sign-in completed');
      return {};
    } catch (error) {
      const { code } = getAuthErrorInfo(error);
      logAuth('google sign-in failed', { code });

      const failureMode = getGoogleAuthFailureMode(error);
      if (failureMode.shouldTryRedirect) {
        try {
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({
            prompt: 'select_account'
          });
          await signInWithRedirect(auth, provider);
          return {};
        } catch (redirectError) {
          const redirectInfo = getAuthErrorInfo(redirectError);
          logAuth('google redirect sign-in failed', { code: redirectInfo.code });
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
      const { code } = getAuthErrorInfo(error);
      logAuth('logout failed', { code });
    }
  },

  resetPassword: async (email: string): Promise<{ error?: string; message?: string }> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { message: RESET_PASSWORD_MESSAGE };
    } catch (error) {
      const { code } = getAuthErrorInfo(error);
      logAuth('password reset request failed', { code });

      if (code === 'auth/invalid-email') {
        return { error: 'Invalid email address format.' };
      }

      return { message: RESET_PASSWORD_MESSAGE };
    }
  },
};
