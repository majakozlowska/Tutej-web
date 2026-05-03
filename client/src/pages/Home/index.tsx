import styles from './home.module.scss'
import Heading from '../../components/Heading'

export function Home() {
	return (
		<div className={styles.container}>
			<Heading text="Strona główna" />
		</div>
	)
}
