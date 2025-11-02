


require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// 🧠 Security + Middleware setup
app.use(helmet());
app.use(cors({
  origin: [
    "https://zaddiii.github.io", // your frontend
    "http://localhost:5173"      // for local testing
  ]
}));
app.use(express.json());
app.use(morgan('dev'));

// ✅ Health check route
app.get('/', (req, res) => {
  res.send('🚀 Scalable backend running smoothly');
});

// 🎯 Reward route — matches frontend
app.post('/reward', async (req, res) => {
  const { wallet } = req.body;

  if (!wallet) {
    return res.status(400).json({ ok: false, error: 'Wallet address missing' });
  }

  // Simulate async reward logic (like sending tokens)
  await new Promise(resolve => setTimeout(resolve, 200));

  res.json({
    ok: true,
    tx: `rewarded-${wallet}-simulated`,
    message: `Reward sent successfully to wallet ${wallet}`
  });
});

// 🌐 Port setup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} 🌀`));