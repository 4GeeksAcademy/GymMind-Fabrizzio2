import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "../context/LanguageContext.jsx";

export const MobileNavbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const { lang, toggleLang, t } = useLang();

    const goTo = (path) => {
        setIsOpen(false);
        navigate(path);
    };

    const handleLogout = () => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        navigate("/login");
    };

    return (
        <nav className="mobile-navbar">
            <div className="mobile-navbar-logo" onClick={() => goTo("/dashboard")}>
                GYMMIND AI
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                    onClick={toggleLang}
                    style={{
                        background: "transparent",
                        border: "1px solid rgba(0,229,255,0.3)",
                        color: "#00e5ff",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "700",
                        cursor: "pointer",
                        letterSpacing: "0.5px",
                    }}
                >
                    {lang === "en" ? "🌐 ES" : "🌐 EN"}
                </button>

                <button
                    type="button"
                    className="hamburger-btn"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    ☰
                </button>
            </div>

            {isOpen && (
                <div className="mobile-menu">
                    <button onClick={() => goTo("/dashboard")}>{t("nav_dashboard")}</button>
                    <button onClick={() => goTo("/workout")}>{t("nav_workout")}</button>
                    <button onClick={() => goTo("/moodcheck")}>{t("nav_moodcheck")}</button>
                    <button onClick={() => goTo("/progress")}>{t("nav_progress")}</button>
                    <button onClick={() => goTo("/nutrition")}>{t("nav_nutrition")}</button>
                    <button onClick={() => goTo("/profile")}>{t("nav_profile")}</button>
                    <button className="mobile-logout" onClick={handleLogout}>{t("mobile_signout")}</button>
                </div>
            )}
        </nav>
    );
};