import styles from './text.module.scss';

interface textProps {
    text: string;
}

export function Text({ text }: textProps) {
    return (
        <p className={styles.text}>{text}</p>
    );
}