



const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');

dotenv.config();
const app = express();

// ✅ Allow CORS from your frontend domain (GitHub Pages)
app.use(cors({
  origin: ['https://zaddiii.github.io'], // ← replace with your actual GitHub Pages URL
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());
app.use(helmet());
app.use(morgan('dev'));

// ✅ Root route
app.get('/', (req, res) => {
  res.json({ message: 'Backend is running fine!' });
});

// ✅ Example reward endpoint
app.post('/api/reward', (req, res) => {
  res.json({
    ok: true,
    tx: 'SIMULATED_TX_HASH',
    message: 'Reward successfully processed for test user with score 100',
    backend: 'https://rpg-backend-gocj.onrender.com'
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});