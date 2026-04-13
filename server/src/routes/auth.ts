import { Router, type Request, type Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const router = Router();
const prisma = new PrismaClient();

router.post("/register", async (req: Request, res: Response) => {
    const { firstName, lastName, email, password, neighborhoodId } = req.body;

    try {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ message: "Email już istnieje." });
        }

        const hashed = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: { firstName, lastName, email, password: hashed, neighborhoodId },
        });

        return res.status(201).json({ message: "Zarejestrowano.", userId: user.id });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Błąd serwera." });
    }
});

export default router;