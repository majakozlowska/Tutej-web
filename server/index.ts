import express from 'express';
import type { Request, Response } from 'express';

const app = express();
const port = 5067;

app.get('/', (req: Request, res: Response) => {
    res.send('Backend działa!');
});

app.listen(port, () => {
    console.log(`Serwer na porcie ${port}`);
});