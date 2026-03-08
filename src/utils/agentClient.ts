import { getCloudFunctionUrl, getFirebaseIdToken } from '@/utils/cloudFunctions';

/**
 * Get Firebase Auth token for Cloud Functions calls
 */
const getAuthToken = async (): Promise<string | null> => {
  try {
    return await getFirebaseIdToken();
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
};

interface AgentResponse {
  status: 'success' | 'needs_info' | 'error';
  actionTaken: 'created_entry' | 'clarification' | 'conversation' | 'none';
  entryId?: string;
  agentReply: string;
}

/**
 * Sends a voice transcript to the Firebase Agent for autonomous processing.
 * 
 * @param transcript The exact text the user spoke
 * @param conversationHistory Optional past messages for context
 * @returns The agent's decision and spoken response
 */
export const sendToVoiceAgent = async (
  transcript: string, 
  conversationHistory: any[] = []
): Promise<AgentResponse> => {
  
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(getCloudFunctionUrl('voiceAgent'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        transcript,
        conversationHistory
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data: AgentResponse = await response.json();
    console.log("🤖 Agent Response:", data);
    
    return data;
    
  } catch (error) {
    console.error('Agent processing failed:', error);
    return {
      status: 'error',
      actionTaken: 'none',
      agentReply: "I'm sorry, I'm having trouble connecting to my processing core right now."
    };
  }
};