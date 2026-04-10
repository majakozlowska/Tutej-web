import { Outlet } from "react-router-dom";
import { Navbar } from "../Navbar";
import styles from "./mainLayout.module.scss";

export function MainLayout() {
    return (
        <div className={styles.mainLayout}>
            <main className={styles.content}>
                <Outlet />
            </main>
            <div className={styles.navbar}>
                <Navbar />
            </div>
        </div>
    );
};