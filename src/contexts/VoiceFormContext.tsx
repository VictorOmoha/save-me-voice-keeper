import React, { createContext, useContext, useState } from 'react';

interface VoiceFormContextType {
  // Form field setters that can be called from voice conversation
  formTitleSetter: ((title: string) => void) | null;
  formCategorySetter: ((category: string) => void) | null;
  
  // Methods to register/unregister form setters
  registerFormSetters: (titleSetter: (title: string) => void, categorySetter: (category: string) => void) => void;
  unregisterFormSetters: () => void;
}

const VoiceFormContext = createContext<VoiceFormContextType | null>(null);

export const useVoiceFormContext = () => {
  const context = useContext(VoiceFormContext);
  if (!context) {
    throw new Error('useVoiceFormContext must be used within a VoiceFormProvider');
  }
  return context;
};

export const VoiceFormProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [formTitleSetter, setFormTitleSetter] = useState<((title: string) => void) | null>(null);
  const [formCategorySetter, setFormCategorySetter] = useState<((category: string) => void) | null>(null);

  const registerFormSetters = (titleSetter: (title: string) => void, categorySetter: (category: string) => void) => {
    console.log('Registering form setters for voice input');
    setFormTitleSetter(() => titleSetter);
    setFormCategorySetter(() => categorySetter);
  };

  const unregisterFormSetters = () => {
    console.log('Unregistering form setters');
    setFormTitleSetter(null);
    setFormCategorySetter(null);
  };

  return (
    <VoiceFormContext.Provider
      value={{
        formTitleSetter,
        formCategorySetter,
        registerFormSetters,
        unregisterFormSetters,
      }}
    >
      {children}
    </VoiceFormContext.Provider>
  );
};