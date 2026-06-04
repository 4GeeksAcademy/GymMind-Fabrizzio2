import { createContext, useContext, useState } from "react";
import { translations } from "../translations/index.js";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [lang, setLang] = useState(
        localStorage.getItem("gymmind_lang") || "en"
    );

    const toggleLang = () => {
        const next = lang === "en" ? "es" : "en";
        setLang(next);
        localStorage.setItem("gymmind_lang", next);
    };

    const t = (key) => translations[lang][key] || key;

    return (
        <LanguageContext.Provider value={{ lang, toggleLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLang = () => useContext(LanguageContext);
