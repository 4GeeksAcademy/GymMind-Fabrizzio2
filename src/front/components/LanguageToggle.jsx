import { useLang } from "../context/LanguageContext.jsx";
import { useLocation } from "react-router-dom";

export const LanguageToggle = () => {
    const { lang, toggleLang } = useLang();
    const location = useLocation();

    if (location.pathname === "/profile") return null;

    return (
        <>
            <style>{`
                @media (max-width: 768px) {
                    .lang-toggle-desktop { display: none !important; }
                }
            `}</style>
            <button
                className="lang-toggle-desktop"
                onClick={toggleLang}
                title="Change language"
                style={{
                    position: "fixed",
                    top: "12px",
                    right: "155px",
                    zIndex: 9999,
                    background: "transparent",
                    border: "1px solid rgba(0,229,255,0.35)",
                    color: "#00e5ff",
                    padding: "5px 12px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "700",
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    letterSpacing: "0.5px",
                    transition: "all 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(0,229,255,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
                {lang === "en" ? "🌐 ES" : "🌐 EN"}
            </button>
        </>
    );
};