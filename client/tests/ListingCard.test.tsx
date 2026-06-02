import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import ListingCard from '../src/components/ListingCard'

const mockListing = {
    id: 42,
    title: 'Rower górski Kross',
    description: 'Stan idealny, mało używany.',
    price: 1500,
    contact: '500-600-700',
    status: 'AVAILABLE' as const,
    createdAt: '2026-05-10T10:00:00.000Z',
    authorId: 200,
    author: { firstName: 'Jan', lastName: 'Kowalski' },
    images: [{ id: 1, url: 'kross.jpg' }]
}

describe('ListingCard Component - Testy integracji stanu i sieci (Bez tautologii)', () => {

    beforeEach(() => {
        localStorage.clear()
        vi.stubGlobal('fetch', vi.fn())
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('Asynchroniczne mutacje stanu i obsługa sieci', () => {
        it('powinien zablokować przyciski podczas wysyłania żądania PATCH i zaktualizować status po sukcesie', async () => {
            localStorage.setItem('userId', '200')

            let resolveNetworkCall!: (value: Response) => void
            const networkPromise = new Promise<Response>((resolve) => {
                resolveNetworkCall = resolve
            })

            const fetchMock = vi.mocked(fetch).mockImplementation(() => networkPromise)

            const onUpdateMock = vi.fn()
            render(<ListingCard listing={mockListing} onUpdate={onUpdateMock} />)

            const reserveBtn = screen.getByRole('button', { name: 'ZAREZERWOWANE' })

            act(() => {
                fireEvent.click(reserveBtn)
            })

            expect(reserveBtn).toBeDisabled()

            await act(async () => {
                resolveNetworkCall({
                    ok: true,
                    json: () => Promise.resolve({ ...mockListing, status: 'RESERVED' as const }),
                } as Response)
            })

            expect(reserveBtn).not.toBeDisabled()
            expect(onUpdateMock).toHaveBeenCalledWith(expect.objectContaining({ status: 'RESERVED' }))
        })
    })

    describe('Reaktywność i synchronizacja źródeł danych', () => {
        it('powinien zaktualizować wewnętrzny stan, gdy zewnętrzny rekord ulegnie zmianie', () => {
            localStorage.setItem('userId', '999') 
            
            const { rerender } = render(<ListingCard listing={mockListing} />)
            
            expect(screen.getByText('Dostępne')).toBeTruthy()

            const externallyUpdatedListing = { ...mockListing, status: 'SOLD' as const }
            rerender(<ListingCard listing={externallyUpdatedListing} />)

            expect(screen.getByText('Sprzedane')).toBeTruthy()
            expect(screen.queryByText('Dostępne')).toBeNull()
        })
    })

    describe('Logika transformacji danych brudnych (Typowanie any)', () => {
        it('powinien poprawnie sformatować cenę, gdy zostanie przekazana jako tekst/string liczbowy', () => {
            const dirtyDataListing = {
                ...mockListing,
                price: '2499.50'
            }

            render(<ListingCard listing={dirtyDataListing} />)

            expect(screen.getByText(/2\s*499,5\s*PLN/)).toBeTruthy()
        })

        it('powinien wyświetlić "Darmowe", jeśli wartość ceny to logiczne zero w postaci tesktowej', () => {
            const freeListing = { ...mockListing, price: '0.00' }
            render(<ListingCard listing={freeListing} />)

            expect(screen.getByText('Darmowe')).toBeTruthy()
        })
    })
})