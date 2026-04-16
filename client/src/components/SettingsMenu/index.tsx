import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./settingsMenu.module.scss";

interface SettingsMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsMenu({ isOpen, onClose }: SettingsMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        }
        if (isOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onClose]);

    const handleLogout = () => {
        localStorage.removeItem("isAuth");
        onClose();
        navigate("/login");
    };
    if (!isOpen) return null;

    return (
        <div className={styles.menu} ref={menuRef}>
            <ul>
                <li><button onClick={onClose}>Ustawienia główne</button></li>
                <li><button onClick={onClose}>Wsparcie</button></li>
                <li className={styles.divider} />
                <li><button className={styles.logout} onClick={handleLogout}>Wyloguj się</button></li>
            </ul>
        </div>
    );
}