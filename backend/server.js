import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import repoRoutes from './routes/repo.js';
import agentRoutes from './routes/agent.js';
import mongoose from 'mongoose';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/git-history')
    .then(() => console.log('📦 Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));

// Routes
app.use('/api/repo', repoRoutes);
app.use('/api/agent', agentRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Git History Traveller API running' });
});

app.listen(PORT, () => {
    console.log(`\n🚀 Git History Traveller API running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health\n`);
});
