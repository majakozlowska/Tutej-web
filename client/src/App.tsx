import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Home } from './pages/Home'
import { Events } from './pages/Events'
import { Trade } from './pages/Trade'
import NoticesPage from './pages/Notices'
import { MainLayout } from './components/MainLayout'
import ForumPage from './pages/Forum'
import ForumThreadPage from './components/ForumThread'
import ForumPostPage from './components/ForumPost'
import SettingsLayout from './pages/Settings'
import SettingsAccount from './pages/Settings/Account'
import SettingsSupport from './pages/Settings/Support'

function App() {
	const isAuth = !!localStorage.getItem('token')

	return (
		<BrowserRouter>
			<Routes>
				<Route path="/login" element={<Login />} />
				<Route path="/register" element={<Register />} />
				<Route path="/" element={isAuth ? <MainLayout /> : <Navigate to="/login" />}>
					<Route index element={<Home />} />
					<Route path="events" element={<Events />} />
					<Route path="trade" element={<Trade />} />
					<Route path="forum" element={<ForumPage />} />
					<Route path="forum/:forumId" element={<ForumThreadPage />} />
					<Route path="forum/:forumId/post/:postId" element={<ForumPostPage />} />
					<Route path="notices" element={<NoticesPage />} />
					<Route path="settings" element={<SettingsLayout />}>
						<Route path="account" element={<SettingsAccount />} />
						<Route path="support" element={<SettingsSupport />} />
					</Route>
				</Route>
			</Routes>
		</BrowserRouter>
	)
}

export default App
