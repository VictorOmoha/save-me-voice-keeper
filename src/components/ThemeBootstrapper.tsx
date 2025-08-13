import React, { useEffect, useRef } from "react";
import { useTheme } from "./ThemeProvider";
import { useUserPreferences } from "@/hooks/useUserPreferences";

export const ThemeBootstrapper: React.FC = () => {
  const { setTheme } = useTheme();
  const { preferences, isLoading } = useUserPreferences();
  const appliedRef = useRef(false);

  useEffect(() => {
    if (!appliedRef.current && !isLoading && preferences?.theme) {
      setTheme(preferences.theme);
      appliedRef.current = true;
    }
  }, [isLoading, preferences?.theme, setTheme]);

  return null;
};
