import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EventCard from '../src/components/EventCard'


vi.mock('../src/components/Button', () => ({
    default: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>
}))

const mockEvent = {
    id: 1,
    name: 'Koncert na Wildzie',
    description: 'Świetny koncert plenerowy.',
    place: 'Poznań, Rynek Wildecki',
    date: '2026-06-15T19:00:00.000Z',
    duration: '2h',
    price: 0, 
    image: 'wilda.jpg',
    authorId: 100,
    author: { firstName: 'Jan', lastName: 'Kowalski' },
    attendees: [{ id: 2, firstName: 'Anna' }]
}

describe('EventCard Component - Testy logiki i efektów (Bez tautologii)', () => {

    beforeEach(() => {
        localStorage.clear()
        document.body.style.overflow = 'auto'
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('Zarządzanie stanem globalnego DOM (Scroll Lock)', () => {
        it('powinien zablokować przewijanie body po otwarciu modala i odblokować po jego zamknięciu', async () => {
            render(<EventCard event={mockEvent} onDelete={vi.fn()} />)

            expect(document.body.style.overflow).toBe('auto')

            const card = screen.getByRole('heading', { name: 'Koncert na Wildzie' })
            await userEvent.click(card)

            expect(document.body.style.overflow).toBe('hidden')

            const backButton = screen.getByRole('button', { name: '' }) 
            await userEvent.click(backButton)

            expect(document.body.style.overflow).toBe('auto')
        })
    })

    describe('Bezpieczeństwo i autoryzacja (Widoczność akcji)', () => {
        it('powinien ukryć przycisk usuwania, jeśli aktualny użytkownik nie jest autorem wydarzenia', () => {
            localStorage.setItem('userId', '999')

            const { container } = render(<EventCard event={mockEvent} onDelete={vi.fn()} />)

            const deleteButton = container.querySelector('button')
            expect(deleteButton).toBeNull()
        })

        it('powinien wyświetlić przycisk usuwania i pozwolić na usunięcie, jeśli zalogowany użytkownik to autor', async () => {
            localStorage.setItem('userId', '100')
            const onDeleteMock = vi.fn()

            const { container } = render(<EventCard event={mockEvent} onDelete={onDeleteMock} />)

            const deleteButton = container.querySelector('button')
            expect(deleteButton).toBeTruthy()

            await userEvent.click(deleteButton!)

            expect(onDeleteMock).toHaveBeenCalledTimes(1)
            expect(onDeleteMock).toHaveBeenCalledWith(1)
        })
    })

    describe('Prezentacja i transformacja danych biznesowych', () => {
        it('powinien wyświetlić tekst "Darmowe", gdy cena wynosi 0', async () => {
            render(<EventCard event={mockEvent} onDelete={vi.fn()} />)

            const card = screen.getByRole('heading', { name: 'Koncert na Wildzie' })
            await userEvent.click(card)

            expect(screen.getByText('Darmowe')).toBeTruthy()
        })

        it('powinien sformatować i dokleić walutę PLN, gdy cena jest większa od zera', async () => {
            const paidEvent = { ...mockEvent, price: 49 }
            render(<EventCard event={paidEvent} onDelete={vi.fn()} />)

            const card = screen.getByRole('heading', { name: 'Koncert na Wildzie' })
            await userEvent.click(card)

            expect(screen.getByText('49 PLN')).toBeTruthy()
            expect(screen.queryByText('Darmowe')).toBeNull()
        })
    })
})