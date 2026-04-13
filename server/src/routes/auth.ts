import { Router, type Request, type Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const router = Router();
const prisma = new PrismaClient();

router.post("/register", async (req: Request, res: Response) => {
    const { firstName, lastName, email, password, neighborhoodId, neighborhood } = req.body;
    console.log("ID DZIELNICY:", neighborhoodId);

    try {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ message: "Email już istnieje." });
        }

        const hashed = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: { firstName, lastName, email, password: hashed,neighborhood: {
                    connect: { id: Number(neighborhoodId) }
                } },
        });

        return res.status(201).json({ message: "Zarejestrowano.", userId: user.id });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Błąd serwera." });
    }
});
router.post("/login", async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(401).json({ message: "Nieprawidłowy email lub hasło." });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Nieprawidłowy email lub hasło." });
        }

        return res.status(200).json({ message: "Zalogowano.", userId: user.id });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Błąd serwera." });
    }
});

export default router;