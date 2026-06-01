import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "THEME_MODE";

const ThemeModeContext = createContext({
  mode: "dark",
  toggleMode: () => {},
  setMode: () => {},
});

const getInitialMode = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch (_) {
    // localStorage unavailable — fall through
  }
  return "dark";
};

export const ThemeModeProvider = ({ children }) => {
  const [mode, setMode] = useState(getInitialMode);

  // Reflect the mode on <html data-theme> so the CSS variables in index.css
  // switch, and persist the choice.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch (_) {
      // ignore persistence errors
    }
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      toggleMode: () => setMode((m) => (m === "dark" ? "light" : "dark")),
    }),
    [mode],
  );

  return (
    <ThemeModeContext.Provider value={value}>
      {children}
    </ThemeModeContext.Provider>
  );
};

export const useThemeMode = () => useContext(ThemeModeContext);
