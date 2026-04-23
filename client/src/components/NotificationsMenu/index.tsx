import { useRef, useEffect, useState } from "react";
import styles from "./notificationsMenu.module.scss";

interface NotificationsMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export function NotificationsMenu({ isOpen, onClose }: NotificationsMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [shouldRender, setShouldRender] = useState(isOpen);

    useEffect(() => {
        if (isOpen) setShouldRender(true);
    }, [isOpen]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setTimeout(() => onClose(), 0);
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

    if (!shouldRender) return null;

    const notifications = [
        { id: 1, content: "Twoje ogłoszenie zostało zaakceptowane!", time: "2 min temu" },
        { id: 2, content: "Ktoś skomentował Twój post w sąsiedztwie.", time: "1 godz. temu" }
    ];

    return (
        <div
            className={`${styles.menu} ${!isOpen ? styles.closing : ""}`}
            ref={menuRef}
            onAnimationEnd={handleAnimationEnd}
        >
            <div className={styles.header}>Powiadomienia</div>
            <ul>
                {notifications.map(n => (
                    <li key={n.id} className={styles.item}>
                        <div className={styles.imageWrapper}>
                        </div>
                        <div className={styles.body}>
                            <p className={styles.content}>{n.content}</p>
                            <span className={styles.time}>{n.time}</span>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}