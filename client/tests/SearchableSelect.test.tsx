import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SearchableSelect from '../src/components/SearchableSelect'

describe('SearchableSelect Component - Testy integracji danych (Bez tautologii)', () => {

    beforeEach(() => {
        vi.restoreAllMocks()
    })

    describe('Asynchroniczne pobieranie i mapowanie danych', () => {
        it('powinien pobrać dane z API i zmapować surową strukturę [id, name] na [value, label]', async () => {
            const mockNeighborhoods = [
                { id: 10, name: 'Osiedle Piastowskie' },
                { id: 20, name: 'Osiedle Rzeczypospolitej' }
            ]

            const fetchMock = vi.fn().mockResolvedValue({
                json: () => Promise.resolve(mockNeighborhoods)
            })
            vi.stubGlobal('fetch', fetchMock)

            render(<SearchableSelect onChange={vi.fn()} />)

            expect(fetchMock).toHaveBeenCalledWith('http://localhost:5000/api/neighborhoods')

            const selectWrapper = screen.getByText('Osiedle')
            await userEvent.click(selectWrapper)

            await waitFor(() => {
                expect(screen.getByText('Osiedle Piastowskie')).toBeTruthy()
                expect(screen.getByText('Osiedle Rzeczypospolitej')).toBeTruthy()
            })
        })

        it('powinien wyłączyć wskaźnik ładowania, jeśli zapytanie do API zakończy się błędem sieci', async () => {
            const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'))
            vi.stubGlobal('fetch', fetchMock)

            const { container } = render(<SearchableSelect onChange={vi.fn()} />)

            await waitFor(() => {
                const loadingIndicator = container.querySelector('.react-select__loading-indicator')
                expect(loadingIndicator).toBeNull()
            })
        })
    })

    describe('Interakcja i translacja zdarzeń', () => {
        it('powinien wyekstrahować samo ID liczbowe i przekazać je do funkcji wyższego rzędu', async () => {
            const onChangeMock = vi.fn()
            const mockNeighborhoods = [{ id: 44, name: 'Wilda' }]

            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
                json: () => Promise.resolve(mockNeighborhoods)
            }))

            render(<SearchableSelect onChange={onChangeMock} />)

            const selectWrapper = screen.getByText('Osiedle')
            await userEvent.click(selectWrapper)
            
            const option = await screen.findByText('Wilda')
            await userEvent.click(option)

            expect(onChangeMock).toHaveBeenCalledTimes(1)
            expect(onChangeMock).toHaveBeenCalledWith(44)
        })
    })
})