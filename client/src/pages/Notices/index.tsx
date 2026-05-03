import styles from './notices.module.scss'
import Heading from '../../components/Heading'

export function Notices() {
	return (
		<div className={styles.container}>
			<Heading text="Ogłoszenia" />
		</div>
	)
}
