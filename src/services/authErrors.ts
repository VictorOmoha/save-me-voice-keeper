export interface AuthErrorInfo {
  code?: string;
  message: string;
}

export interface GoogleAuthFailureMode {
  shouldTryRedirect: boolean;
  message: string;
}

export const getAuthErrorInfo = (error: unknown): AuthErrorInfo => {
  if (error instanceof Error) {
    const code = 'code' in error ? (error as { code?: string }).code : undefined;
    return { code, message: error.message };
  }

  if (error && typeof error === 'object') {
    const maybeError = error as { code?: unknown; message?: unknown };
    return {
      code: typeof maybeError.code === 'string' ? maybeError.code : undefined,
      message: typeof maybeError.message === 'string' ? maybeError.message : String(error),
    };
  }

  return { message: String(error) };
};

const isGoogleIframeDomException = (error: unknown, message: string): boolean => {
  return (
    error instanceof DOMException ||
    message.toLowerCase().includes('operation failed for an operation-specific reason')
  );
};

export const getGoogleAuthFailureMode = (error: unknown): GoogleAuthFailureMode => {
  const { code, message } = getAuthErrorInfo(error);

  if (code === 'auth/popup-closed-by-user') {
    return { shouldTryRedirect: false, message: 'Sign-in was cancelled' };
  }

  if (code === 'auth/popup-blocked' || isGoogleIframeDomException(error, message)) {
    return {
      shouldTryRedirect: true,
      message: 'Google popup sign-in was blocked by this browser. Redirecting to Google sign-in...',
    };
  }

  if (code === 'auth/unauthorized-domain') {
    return {
      shouldTryRedirect: false,
      message: 'This domain is not authorized for sign-in. Please contact support.',
    };
  }

  return { shouldTryRedirect: false, message: message || 'An unexpected error occurred' };
};
