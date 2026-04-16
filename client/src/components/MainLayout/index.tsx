import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "../Navbar";
import { SettingsMenu } from "../SettingsMenu";
import styles from "./mainLayout.module.scss";

export function MainLayout() {
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

            </main>
            <div className={styles.navbar}>
                <Navbar />
            </div>
        </div>
    );
};