import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Button from '../src/components/Button'
import { text } from 'stream/iter'
//import '@testing-library/jest-dom';

describe('Button', () => {
	it('renderuje tekst z propa text', () => {
		render(<Button text="Kliknij mnie" />)
		expect(screen.getByText('Kliknij mnie')).toBeInTheDocument()
	})

	it('renderuje children zamiast text gdy oba podane', () => {
		render(<Button text="Tekst"><span>Dziecko</span></Button>)
		expect(screen.getByText('Dziecko')).toBeInTheDocument()
		expect(screen.queryByText('Tekst')).not.toBeInTheDocument()
	})

	it('renderuje samo children bez propa text', () => {
		render(<Button><span data-testid="icon">★</span></Button>)
		expect(screen.getByTestId('icon')).toBeInTheDocument()
	})

	it('przekazuje event do onClick', () => {
		const handleClick = vi.fn()
		render(<Button text="Klik" onClick={handleClick} />)
		fireEvent.click(screen.getByRole('button'))
		expect(handleClick).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }))
	})

	it('nie wywołuje onClick gdy disabled', () => {
		const handleClick = vi.fn()
		render(<Button text="Klik" onClick={handleClick} disabled />)
		fireEvent.click(screen.getByRole('button'))
		expect(handleClick).not.toHaveBeenCalled()
	})

	it('button ma atrybut disabled gdy disabled=true', () => {
		render(<Button text="Klik" disabled />)
		expect(screen.getByRole('button')).toBeDisabled()
	})

	it('button nie jest disabled domyślnie', () => {
		render(<Button text="Klik" />)
		expect(screen.getByRole('button')).not.toBeDisabled()
	})

	it('stosuje klasę CSS dla wariantu secondary', () => {
		render(<Button text="Klik" variant="secondary" />)
		expect(screen.getByRole('button').className).toMatch(/secondary/)
	})

	it('stosuje klasę CSS dla wariantu delete', () => {
		render(<Button text="Usuń" variant="delete" />)
		expect(screen.getByRole('button').className).toMatch(/delete/)
	})
})