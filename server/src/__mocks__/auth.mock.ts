import type { Request, Response, NextFunction } from 'express'

export const mockUser = {
  id: 1,
  firstName: 'Jan',
  lastName: 'Kowalski',
  email: 'jan@example.com',
  role: 'USER',
  neighborhoodId: 10,
}

// authenticate można nadpisać w konkretnym teście przez:
// jest.mocked(authenticate).mockImplementation(...)
export const authenticate = jest.fn((req: Request, _res: Response, next: NextFunction) => {
  ;(req as any).user = mockUser
  next()
})