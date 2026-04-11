import styles from "./heading.module.scss";

interface HeadingProps {
    text: string;
}

export function Heading({ text }: HeadingProps) {
    return (
        <h1 className={styles.heading}>{text}</h1>
    );
}