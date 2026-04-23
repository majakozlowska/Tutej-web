import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Home } from './pages/Home'
import { Events } from './pages/Events'
import { Trade } from './pages/Trade'
import { Forum } from './pages/Forum'
import { Notices } from './pages/Notices'
import { MainLayout } from './components/MainLayout'

function App() {
	const isAuth = localStorage.getItem('isAuth') === 'true'
	console.log(isAuth)
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/login" element={<Login />} />
				<Route path="/register" element={<Register />} />
				<Route path="/" element={isAuth ? <MainLayout /> : <Navigate to="/login" />}>
					<Route index element={<Home />} />
					<Route path="events" element={<Events />} />
					<Route path="trade" element={<Trade />} />
					<Route path="forum" element={<Forum />} />
					<Route path="notices" element={<Notices />} />
				</Route>
			</Routes>
		</BrowserRouter>
	)
}

export default App
