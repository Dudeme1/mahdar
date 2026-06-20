import { createContext, useContext, useState, useEffect } from "react";
import { translations } from "./translations";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(
    () => localStorage.getItem("mahdari_language") || "en"
  );

  const isRTL = language === "ar";

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem("mahdari_language", lang);
  };

  // Sync <html> dir and lang attributes for global RTL layout
  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [isRTL, language]);

  // Resolves dot-separated keys; replaces {{var}} placeholders.
  // Returns arrays/objects as-is (for feature lists, reason arrays, etc.)
  const t = (key, vars = {}) => {
    const keys = key.split(".");
    let value = translations[language];
    for (const k of keys) {
      if (value == null) return key;
      value = value[k];
    }
    if (value == null) return key;
    if (typeof value === "string") {
      return value.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] != null ? vars[k] : `{{${k}}}`));
    }
    return value;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be inside LanguageProvider");
  return ctx;
}
