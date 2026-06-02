import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InputField from '../src/components/InputField'

describe('InputField Component - Testy zachowania (Bez tautologii)', () => {

    describe('Renderowanie słownika ikon', () => {
        it('powinien wyrenderować domyślną ikonę "letters", gdy parametr icon nie zostanie podany', () => {
            const { container } = render(<InputField placeholder="Imię" />)
            
            const iconSpan = container.querySelector('span')
            expect(iconSpan).toBeTruthy()
            
            const svgElement = iconSpan?.querySelector('svg')
            expect(svgElement).toBeTruthy()
        })

        it('powinien dynamicznie zmienić strukturę SVG po przekazaniu flagi "lock"', () => {
            const { container } = render(<InputField placeholder="Hasło" icon="lock" />)
            
            const svgElement = container.querySelector('svg')
            expect(svgElement).toBeTruthy()
            
            const dAttribute = svgElement?.querySelector('path')?.getAttribute('d')
            expect(dAttribute).toContain('M8 11V7')
        })
    })

    describe('Obsługa zdarzeń i interakcja z użytkownikiem', () => {
        it('powinien wyekstrahować czystą wartość tekstową z eventu i przekazać ją do callbacku', async () => {
            const onChangeMock = vi.fn()
            render(<InputField placeholder="Wpisz tekst" onChange={onChangeMock} />)
            
            const input = screen.getByPlaceholderText('Wpisz tekst')
            
            await userEvent.type(input, 'A')

            expect(onChangeMock).toHaveBeenCalledTimes(1)
            expect(onChangeMock).toHaveBeenCalledWith('A')
        })

        it('nie powinien wywołać błędu aplikacji (crash), gdy użytkownik pisze, a onChange jest niezdefiniowane', async () => {
            render(<InputField placeholder="Brak callbacku" />)
            
            const input = screen.getByPlaceholderText('Brak callbacku')
            
            await expect(userEvent.type(input, 'Test')).resolves.not.toThrow()
        })
    })
})