import styles from "./home.module.scss";

export function Home() {
    return (
        <div className={styles.container}>
            <h1 className={styles.pageTitle}>Home</h1>
            <h1 className={styles.title}>Witaj w Tutej</h1>
        </div>
    );
}