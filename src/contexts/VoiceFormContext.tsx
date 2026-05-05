/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';

interface VoiceFormContextType {
  // Form field setters that can be called from voice conversation
  formTitleSetter: ((title: string) => void) | null;
  formCategorySetter: ((category: string) => void) | null;
  formAddFieldFunction: ((fieldName?: string, fieldType?: string) => void) | null;
  
  // Methods to register/unregister form setters
  registerFormSetters: (
    titleSetter: (title: string) => void, 
    categorySetter: (category: string) => void,
    addFieldFunction?: (fieldName?: string, fieldType?: string) => void
  ) => void;
  unregisterFormSetters: () => void;
}

const VoiceFormContext = createContext<VoiceFormContextType | null>(null);

export const useVoiceFormContext = () => {
  const context = useContext(VoiceFormContext);
  // Return default values if context is not available to prevent crashes
  if (!context) {
    console.warn('useVoiceFormContext called outside of VoiceFormProvider, returning default values');
    return {
      formTitleSetter: null,
      formCategorySetter: null,
      formAddFieldFunction: null,
      registerFormSetters: () => {},
      unregisterFormSetters: () => {},
    };
  }
  return context;
};

export const VoiceFormProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [formTitleSetter, setFormTitleSetter] = useState<((title: string) => void) | null>(null);
  const [formCategorySetter, setFormCategorySetter] = useState<((category: string) => void) | null>(null);
  const [formAddFieldFunction, setFormAddFieldFunction] = useState<((fieldName?: string, fieldType?: string) => void) | null>(null);

  const registerFormSetters = useCallback((
    titleSetter: (title: string) => void, 
    categorySetter: (category: string) => void,
    addFieldFunction?: (fieldName?: string, fieldType?: string) => void
  ) => {
    setFormTitleSetter(() => titleSetter);
    setFormCategorySetter(() => categorySetter);
    setFormAddFieldFunction(() => addFieldFunction);
  }, []);

  const unregisterFormSetters = useCallback(() => {
    setFormTitleSetter(null);
    setFormCategorySetter(null);
    setFormAddFieldFunction(null);
  }, []);

  return (
    <VoiceFormContext.Provider
      value={{
        formTitleSetter,
        formCategorySetter,
        formAddFieldFunction,
        registerFormSetters,
        unregisterFormSetters,
      }}
    >
      {children}
    </VoiceFormContext.Provider>
  );
};