import styles from './forum.module.scss'
import Heading from '../../components/Heading'

export function Forum() {
	return (
		<div className={styles.container}>
			<Heading text="Forum" />
		</div>
	)
}
