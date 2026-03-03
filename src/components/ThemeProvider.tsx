/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "ui-theme",
  ...props
}: ThemeProviderProps) {
  console.log('ThemeProvider: Initializing with defaultTheme:', defaultTheme);
  
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(storageKey) as Theme;
      console.log('ThemeProvider: Stored theme:', stored);
      return stored || defaultTheme;
    } catch (error) {
      console.error('ThemeProvider: Error accessing localStorage:', error);
      return defaultTheme;
    }
  })

  useEffect(() => {
    try {
      const root = document.documentElement;
      const media = window.matchMedia("(prefers-color-scheme: dark)");

      const applyTheme = (t: Theme) => {
        const isDark = t === "dark" || (t === "system" && media.matches);
        root.classList.remove("light", "dark");
        root.classList.add(isDark ? "dark" : "light");
      };

      applyTheme(theme);

      if (theme === "system") {
        const listener = (_e: MediaQueryListEvent) => {
          applyTheme("system");
        };
        media.addEventListener("change", listener);
        return () => media.removeEventListener("change", listener);
      }
    } catch (error) {
      console.error("ThemeProvider: Error applying theme:", error);
    }
  }, [theme])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        setTheme(e.newValue as Theme);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [storageKey]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
