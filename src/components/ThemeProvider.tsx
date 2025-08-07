
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
    console.log('ThemeProvider: useEffect triggered, theme:', theme);
    
    try {
      const root = window.document.documentElement;
      console.log('ThemeProvider: Current classes before:', root.classList.toString());

      root.classList.remove("light", "dark");

      if (theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
          .matches
          ? "dark"
          : "light";
        
        console.log('ThemeProvider: System theme detected:', systemTheme);
        root.classList.add(systemTheme);
        return;
      }

      console.log('ThemeProvider: Adding theme class:', theme);
      root.classList.add(theme);
      
      console.log('ThemeProvider: Current classes after:', root.classList.toString());
    } catch (error) {
      console.error('ThemeProvider: Error in useEffect:', error);
    }
  }, [theme])

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
