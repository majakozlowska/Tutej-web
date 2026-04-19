import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "../Navbar";
import { SettingsMenu } from "../SettingsMenu";
import { NotificationsMenu } from "../NotificationsMenu";


import styles from "./mainLayout.module.scss";

export function MainLayout() {
    const [notifOpen, setNotifOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    return (
        <div className={styles.mainLayout}>
            <main className={styles.content}>
                <Outlet />
                <div className={styles.settingsWrapper}>
                    <button onClick={() => setMenuOpen(prev => !prev)}>
                        <img src={"../../illustrations/settings.png"} />
                    </button>
                    <SettingsMenu
                        isOpen={menuOpen}
                        onClose={() => setMenuOpen(false)}
                    />
                </div>
                <div className={styles.notificationsWrapper}>
                    <button onClick={() => setNotifOpen(prev => !prev)}>
                        <img src={"../../illustrations/bell.png"} />
                    </button>
                    <NotificationsMenu
                        isOpen={notifOpen}
                        onClose={() => setNotifOpen(false)}
                    />
                </div>

            </main>
            <div className={styles.navbar}>
                <Navbar />
            </div>
        </div>
    );
};