import { auth } from '@/lib/firebase';

const PROJECT_ID = 'saveme-f5af0';
const DEFAULT_CLOUD_FUNCTIONS_BASE_URL = `https://us-central1-${PROJECT_ID}.cloudfunctions.net`;

export const getCloudFunctionsBaseUrl = (): string => {
  return import.meta.env.VITE_CLOUD_FUNCTIONS_URL || DEFAULT_CLOUD_FUNCTIONS_BASE_URL;
};

export const getCloudFunctionUrl = (name: string): string => {
  return `${getCloudFunctionsBaseUrl()}/${name}`;
};

export const getFirebaseIdToken = async (): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required');
  return user.getIdToken();
};
