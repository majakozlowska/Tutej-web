const prismaMock = {
  announcement: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  forum: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  post: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  comment: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  neighborhood: {
    findMany: jest.fn(),
  },
  listing: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  event: {
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
}

const PrismaClient = jest.fn(() => prismaMock)

export { PrismaClient }
export default prismaMock