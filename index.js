


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



// index.js
const express = require("express");
const cors = require("cors");

const app = express();

// Allow frontend requests from GitHub Pages or any origin
app.use(
  cors({
    origin: "*", // you can replace "*" with your GitHub Pages URL for stricter security
  })
);
app.use(express.json());

// Use Render’s assigned port or local 3000
const PORT = process.env.PORT || 3000;

// 🧠 Root route (for testing if backend is alive)
app.get("/", (req, res) => {
  res.send("✅ Backend is running on Render at https://rpg-backend-gocj.onrender.com");
});

// 🎁 Reward API endpoint
app.post("/api/reward", (req, res) => {
  const { to, score } = req.body;

  console.log(`🎯 Reward request received from ${to} with score ${score}`);

  // Simulated success response
  res.json({
    ok: true,
    tx: "SIMULATED_TX_HASH",
    message: `Reward for ${to} processed successfully.`,
  });
});

// 🚀 Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server started successfully on port ${PORT}`);
});