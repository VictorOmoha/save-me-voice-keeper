
import { createContext, useContext, useEffect, useState } from "react"
import { logDebug, logError } from "@/utils/logger"

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
  logDebug('ThemeProvider: Initializing with defaultTheme:', defaultTheme);
  
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(storageKey) as Theme;
      logDebug('ThemeProvider: Stored theme:', stored);
      return stored || defaultTheme;
    } catch (error) {
      logError('ThemeProvider: Error accessing localStorage:', error);
      return defaultTheme;
    }
  })

  useEffect(() => {
    try {
      const root = document.documentElement;
      const media = window.matchMedia("(prefers-color-scheme: dark)");

      const applyTheme = (t: Theme) => {
        const isDark = t === "dark" || (t === "system" && media.matches);
        if (isDark) {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
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
      logError("ThemeProvider: Error applying theme:", error);
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
