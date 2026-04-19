import { useRef, useEffect } from "react";
import styles from "./notificationsMenu.module.scss";

interface NotificationsMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export function NotificationsMenu({ isOpen, onClose }: NotificationsMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        }
        if (isOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className={styles.menu} ref={menuRef}>
            <div className={styles.header}>Powiadomienia</div>
            <ul>
                <li className={styles.item}>
                    <div className={styles.imageWrapper} />
                    <div className={styles.body}>
                        <p className={styles.content}>Treść powiadomienia</p>
                        <span className={styles.time}>2 min temu</span>
                    </div>
                </li>
            </ul>
        </div>
    );
}