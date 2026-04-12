import express from 'express';
import cors from 'cors';
import neighborhoodsRouter from './routes/neighborhoods.js';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.use('/api/neighborhoods', neighborhoodsRouter);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});