export interface CurrentUser {
	id: number
	firstName: string
	lastName: string
	email: string
	photo: string | null
	role: 'USER' | 'COUNCILLOR' | 'ADMIN'
	neighborhoodId: number
}

export function getToken(): string | null {
	return localStorage.getItem('token')
}

export function getAuthHeaders(): Record<string, string> {
	const token = getToken()
	return token
		? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
		: { 'Content-Type': 'application/json' }
}

export function getCurrentUser(): CurrentUser | null {
	const token = getToken()
	if (!token) return null
	try {
		return JSON.parse(atob(token.split('.')[1]))
	} catch {
		return null
	}
}

export function logout() {
	localStorage.removeItem('token')
	localStorage.removeItem('isAuth')
}
