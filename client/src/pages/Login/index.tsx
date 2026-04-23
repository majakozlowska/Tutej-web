import style from './login.module.scss'
import Heading from '../../components/Heading'
import Text from '../../components/Text'
import InputField from '../../components/InputField'
import Button from '../../components/Button'
import TextLink from '../../components/TextLink'
import { useState } from 'react'
//import { useNavigate } from "react-router-dom";

export function Login() {
	//const navigate = useNavigate();
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState<string | null>(null)

	const handleLogin = async () => {
		if (!email || !password) {
			setError('Wszystkie pola są wymagane.')
			return
		}

		setError(null)

		try {
			const response = await fetch('http://localhost:5000/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
			})

			const data = await response.json()

			if (!response.ok) {
				setError(data.message || 'Nieprawidłowy email lub hasło.')
				return
			}
			localStorage.setItem('isAuth', 'true')
			console.log('Zalogowano:', data)
			window.location.href = '/'
			//navigate("/");
		} catch {
			setError('Nie można połączyć się z serwerem.')
		}
	}

	return (
		<div className={style.mainContainer}>
			<img
				src="/illustrations/01.svg"
				alt="Login illustration"
				className={style.illustration}
			/>
			<div className={style.container}>
				<Heading text="Witamy ponownie!" />
				<div className={style.form}>
					<Text text="Twoje dane" />
					<InputField
						placeholder="Adres e-mail"
						type="email"
						icon="at"
						onChange={(val) => setEmail(val)}
					/>
					<InputField
						placeholder="Hasło"
						type="password"
						icon="lock"
						onChange={(val) => setPassword(val)}
					/>
					<Button text="Zaloguj się" onClick={handleLogin} />
					{error && <div className={style.errorMsg}>{error}</div>}
				</div>
				<div className={style.question}>
					<Text text="Nie posiadasz jeszcze konta?" />
					<TextLink to="/register" text="Zarejestruj się" />
				</div>
			</div>
		</div>
	)
}
