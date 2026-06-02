import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NoticeCard from '../src/components/NoticeCard'

const mockNotice = {
    id: 1,
    title: 'Remont nawierzchni',
    content: 'Od poniedziałku ruszają prace drogowe na głównym skrzyżowaniu.',
    media: null,
    createdAt: '2026-06-01T12:00:00.000Z',
    author: {
        id: 4,
        firstName: 'Tomasz',
        lastName: 'Nowak',
        photo: null, 
        role: 'ADMIN' as const
    }
}

describe('NoticeCard Component - Testy logiki i algorytmów (Bez tautologii)', () => {

    beforeEach(() => {
        document.body.style.overflow = 'auto'
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.restoreAllMocks()
    })

    describe('Algorytm formatowania dat relatywnych (formatDate)', () => {
        it('powinien zwrócić "przed chwilą", gdy różnica wynosi mniej niż 60 sekund', () => {
            const now = new Date('2026-06-01T12:00:30.000Z')
            vi.setSystemTime(now)

            render(<NoticeCard notice={mockNotice} delay="0s" />)
            
            expect(screen.getByText('przed chwilą')).toBeTruthy()
        })

        it('powinien poprawnie przeliczyć minuty, gdy ogłoszenie dodano np. 25 minut temu', () => {
            const now = new Date('2026-06-01T12:25:00.000Z') 
 vi.setSystemTime(now)

            render(<NoticeCard notice={mockNotice} delay="0s" />)
            
            expect(screen.getByText('25 min temu')).toBeTruthy()
        })

        it('powinien zwrócić pełną datę sformatowaną lokalnie, jeśli minął ponad dzień', () => {
            const now = new Date('2026-06-05T12:00:00.000Z') 
            vi.setSystemTime(now)

            render(<NoticeCard notice={mockNotice} delay="0s" />)
            
            expect(screen.getByText(/1 czerwca 2026/i)).toBeTruthy()
        })
    })

    describe('Logika interfejsu i generowanie fallbacków', () => {
        it('powinien wyrenderować inicjały autora, gdy pole photo jest null', () => {
            render(<NoticeCard notice={mockNotice} delay="0s" />)

            const initialsContainer = screen.getByText('TN')
            expect(initialsContainer).toBeTruthy()
        })

        it('powinien wyrenderować obrazek zamiast inicjałów, jeśli podano link do zdjęcia', () => {
            const noticeWithPhoto = {
                ...mockNotice,
                author: { ...mockNotice.author, photo: 'http://avatar.link/img.jpg' }
            }

            const { container } = render(<NoticeCard notice={noticeWithPhoto} delay="0s" />)

            expect(screen.queryByText('TN')).toBeNull()
            
            const img = container.querySelector('img')
            expect(img?.getAttribute('src')).toBe('http://avatar.link/img.jpg')
        })
    })

    describe('Cykl życia komponentu i czyszczenie efektów (DOM Cleanup)', () => {
    it('powinien zresetować styl overflow na body do wartości "auto" podczas unmountu (odmontowania)', async () => {
        const { unmount } = render(<NoticeCard notice={mockNotice} delay="0s" />)

        const cardButton = screen.getByRole('button', { name: /Remont nawierzchni/i })
        
        fireEvent.click(cardButton)

        expect(document.body.style.overflow).toBe('hidden')

        unmount()

        expect(document.body.style.overflow).toBe('auto')
    })
})
})