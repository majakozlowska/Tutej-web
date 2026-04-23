import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./settingsMenu.module.scss";

interface SettingsMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsMenu({ isOpen, onClose }: SettingsMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const [shouldRender, setShouldRender] = useState(isOpen);

    useEffect(() => {
        if (isOpen) setShouldRender(true);
    }, [isOpen]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setTimeout(() => {
                    onClose();
                }, 0);
            }
        }

        if (isOpen) {
            document.addEventListener("click", handleClickOutside);
        }
        return () => document.removeEventListener("click", handleClickOutside);
    }, [isOpen, onClose]);

    const handleAnimationEnd = () => {
        if (!isOpen) setShouldRender(false);
    };

    const handleLogout = () => {
        localStorage.removeItem("isAuth");
        onClose();
        navigate("/login");
    };

    if (!shouldRender) return null;

    return (
        <div
            className={`${styles.menu} ${!isOpen ? styles.closing : ""}`}
            ref={menuRef}
            onAnimationEnd={handleAnimationEnd}
        >
            <ul>
                <li><button onClick={onClose}>Ustawienia główne</button></li>
                <li><button onClick={onClose}>Konto</button></li>
                <li><button onClick={onClose}>Wsparcie</button></li>
                <li className={styles.divider} />
                <li className={styles.logout}><button onClick={handleLogout}>Wyloguj się</button></li>
            </ul>
        </div>
    );
}