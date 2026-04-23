import styles from './button.module.scss'

interface ButtonProps {
	text: string
	variant?: 'primary' | 'secondary'
	onClick?: () => void
}

export default function Button({ text, variant = 'primary', onClick }: ButtonProps) {
	return (
		<div className={styles.container}>
			<button className={`${styles.button} ${styles[variant]}`} onClick={onClick}>
				{text}
			</button>
		</div>
	)
}
