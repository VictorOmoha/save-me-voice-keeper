import React from "react";
import { Volume2 } from "lucide-react";

interface ConversationDisplayProps {
  conversationState?: { isActive: boolean; currentStep?: { question: string } };
}

export const ConversationDisplay: React.FC<ConversationDisplayProps> = ({
  conversationState,
}) => {
  if (!conversationState?.isActive || !conversationState.currentStep) {
    return null;
  }

  return (
    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
      <div className="flex items-center gap-2 mb-1">
        <Volume2 className="h-3 w-3 text-blue-600" />
        <span className="font-medium text-blue-700 dark:text-blue-300">System:</span>
      </div>
      <p className="text-blue-900 dark:text-blue-100">
        {conversationState.currentStep.question}
      </p>
    </div>
  );
};