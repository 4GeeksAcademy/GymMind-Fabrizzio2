import { Outlet, useLocation } from "react-router-dom"
import ScrollToTop from "../components/ScrollToTop"
import Navbar from "../components/Navbar";
import { Footer } from "../components/Footer"
import AIChat from "../components/AIChat";
import { LanguageToggle } from "../components/LanguageToggle";

export const Layout = () => {
    return (
        <ScrollToTop>
            <Outlet />
            <AIChat />
            <LanguageToggle />
        </ScrollToTop>
    )
}
