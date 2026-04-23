import { Link } from 'react-router-dom'
import styles from './textLink.module.scss'

interface TextLinkProps {
	to: string
	text: string
}

export default function TextLink({ to, text }: TextLinkProps) {
	return (
		<Link to={to} className={styles.textLink}>
			{text}
		</Link>
	)
}
