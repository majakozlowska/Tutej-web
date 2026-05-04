import { useState, useEffect } from 'react'
import style from './Events.module.scss'
import Heading from '../../components/Heading'
import { EventCard } from '../../components/EventCard'

export function Events() {
	const [events, setEvents] = useState([])

	useEffect(() => {
		fetch('http://localhost:5000/api/events')
			.then(res => res.json())
			.then(data => setEvents(data))
	}, [])

	return (
		<div className={style.container}>
			<Heading text="Wydarzenia" />
			<div className={style.eventsGrid}>
				{events.map((e: any) => (
					<EventCard key={e.id} event={e} />
				))}
			</div>
		</div>
	)
}