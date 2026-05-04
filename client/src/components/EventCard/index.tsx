import { useState, useEffect } from 'react'
import style from './eventCard.module.scss'
import Button from '../Button'

interface EventData {
    id: number
    name: string
    description: string
    place: string
    date: string
    duration?: string
    price?: number
    authorId: number
    author: {
        firstName: string
        lastName: string
        photo?: string
    }
    attendees: Array<{
        id: number
        firstName: string
        photo?: string
    }>
}

export function EventCard({ event }: { event: EventData }) {
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : 'auto'
    }, [isOpen])

    const eventDate = new Date(event.date)
    const monthShort = new Intl.DateTimeFormat('pl-PL', { month: 'short' }).format(eventDate).replace('.', '').toUpperCase()
    const dayNumeric = new Intl.DateTimeFormat('pl-PL', { day: '2-digit' }).format(eventDate)
    const fullDateString = new Intl.DateTimeFormat('pl-PL', { weekday: 'long', month: 'long', day: 'numeric' }).format(eventDate)
    const timeString = new Intl.DateTimeFormat('pl-PL', { hour: '2-digit', minute: '2-digit' }).format(eventDate)

    const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(event.place)}&t=&z=14&ie=UTF8&iwloc=&output=embed`

    return (
        <>
            <div className={style.card} onClick={() => setIsOpen(true)}>
                <div className={style.imageWrapper}>
                    <img
                        src={`https://picsum.photos/seed/${event.id}/800/600`}
                        alt={event.name}
                        className={style.image}
                    />
                </div>
                <div className={style.cardBody}>
                    <div className={style.info}>
                        <h2 className={style.title}>{event.name}</h2>
                        <div className={style.belowTitle}>
                            <div>
                                <div className={style.location}>{event.place}</div>
                                <div className={style.meta}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                                         xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M3 21V19C3 17.9391 3.42143 16.9217 4.17157 16.1716C4.92172 15.4214 5.93913 15 7 15H11C12.0609 15 13.0783 15.4214 13.8284 16.1716C14.5786 16.9217 15 17.9391 15 19V21M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M21 21V19C20.9949 18.1172 20.6979 17.2608 20.1553 16.5644C19.6126 15.868 18.8548 15.3707 18 15.15M5 7C5 8.06087 5.42143 9.07828 6.17157 9.82843C6.92172 10.5786 7.93913 11 9 11C10.0609 11 11.0783 10.5786 11.8284 9.82843C12.5786 9.07828 13 8.06087 13 7C13 5.93913 12.5786 4.92172 11.8284 4.17157C11.0783 3.42143 10.0609 3 9 3C7.93913 3 6.92172 3.42143 6.17157 4.17157C5.42143 4.92172 5 5.93913 5 7Z"
                                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    {event.attendees?.length || 0}
                                    <span className={style.dot}>&middot;</span>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                                         xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M12 7V12L15 15M3 12C3 13.1819 3.23279 14.3522 3.68508 15.4442C4.13738 16.5361 4.80031 17.5282 5.63604 18.364C6.47177 19.1997 7.46392 19.8626 8.55585 20.3149C9.64778 20.7672 10.8181 21 12 21C13.1819 21 14.3522 20.7672 15.4442 20.3149C16.5361 19.8626 17.5282 19.1997 18.364 18.364C19.1997 17.5282 19.8626 16.5361 20.3149 15.4442C20.7672 14.3522 21 13.1819 21 12C21 9.61305 20.0518 7.32387 18.364 5.63604C16.6761 3.94821 14.3869 3 12 3C9.61305 3 7.32387 3.94821 5.63604 5.63604C3.94821 7.32387 3 9.61305 3 12Z"
                                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    {timeString}
                                </div>
                            </div>
                            <div className={style.miniCalendar}>
                                <span className={style.month}>{monthShort}</span>
                                <span className={style.day}>{dayNumeric}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isOpen && (
                <div className={style.overlay} onClick={() => setIsOpen(false)}>
                    <div className={style.fullPage} onClick={e => e.stopPropagation()}>
                        <button className={style.back} onClick={() => setIsOpen(false)}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15 6L9 12L15 18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>

                        <div className={style.hero}>
                            <img src={`https://picsum.photos/seed/${event.id}/800/800`} alt={event.name} className={style.heroImage} />
                            <div className={style.heroOverlay}></div>
                            <h1 className={style.heroTitle}>{event.name}</h1>
                            <p className={style.heroLocation}>{event.place}</p>

                            <div className={style.mapContainer}>
                                <iframe src={mapUrl} title="Event Map" loading="lazy"></iframe>
                            </div>
                        </div>

                        <div className={style.detailsContent}>
                            <section>
                                <div className={style.gridBoxes}>
                                    <div className={style.box}>
                                        <span className={style.boxLabel}>KOSZT</span>
                                        <span className={style.boxValue}>
                                            {Number(event.price) === 0 || !event.price ? 'Darmowe' : `${event.price} PLN`}
                                        </span>
                                    </div>
                                    <div className={style.box}>
                                        <span className={style.boxLabel}>CZAS</span>
                                        <span className={style.boxValue}>{event.duration || 'N/A'}</span>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3>KIEDY</h3>
                                <div className={style.whenRow}>
                                    <div className={style.miniCalendar}>
                                        <span className={style.month}>{monthShort}</span>
                                        <span className={style.day}>{dayNumeric}</span>
                                    </div>
                                    <div className={style.whenDetails}>
                                        <p>{fullDateString}</p>
                                        <p>{timeString}</p>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3>ORGANIZATOR</h3>
                                <div className={style.hostRow}>
                                    <img
                                        src={event.author?.photo || `https://ui-avatars.com/api/?name=${event.author?.firstName}+${event.author?.lastName}`}
                                        alt="Host"
                                        className={style.avatar}
                                    />
                                    <span>{event.author?.firstName} {event.author?.lastName}</span>
                                </div>
                            </section>

                            <section>
                                <h3>OPIS</h3>
                                <p className={style.description}>{event.description}</p>
                            </section>

                            <section>
                                <h3>LISTA ZAINTERESOWANYCH ({event.attendees?.length || 0})</h3>
                                <div className={style.guestList}>
                                    <div className={style.avatars}>
                                        {event.attendees?.map(a => (
                                            <img
                                                key={a.id}
                                                src={a.photo || `https://ui-avatars.com/api/?name=${a.firstName}`}
                                                alt={a.firstName}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div className={style.bottomBar}>
                            <div className={style.registerWrap}>
                                <Button text="Jestem zainteresowany/a" variant="primary" />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}