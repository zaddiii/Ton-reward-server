



// ✅ index.js — Clean, Render-ready backend (for GitHub frontend)

// Import dependencies
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

// Initialize app
const app = express();
app.use(express.json());
app.use(cors({
  origin: "*", // 👈 allows your GitHub Pages frontend to connect
}));
app.use(helmet());
app.use(morgan("dev"));

const PORT = process.env.PORT || 3000;

// 🟢 Your Render backend URL
const BACKEND_URL = "https://rpg-backend-gocj.onrender.com";

// ✅ Root route — check if backend is running
app.get("/", (req, res) => {
  res.json({
    message: "✅ RPG Backend is live and connected to GitHub frontend!",
    backend: BACKEND_URL,
  });
});

// ✅ Reward API — called from your frontend
app.post("/api/reward", (req, res) => {
  const { to, score } = req.body;

  if (!to || !score) {
    return res.status(400).json({
      ok: false,
      error: "Missing 'to' or 'score' in request body",
    });
  }

  console.log(`🎯 Reward request received for: ${to}, score: ${score}`);

  // Simulate reward logic — replace with real blockchain logic later if needed
  res.json({
    ok: true,
    tx: "SIMULATED_TX_HASH",
    message: `Reward successfully processed for ${to} with score ${score}`,
    backend: BACKEND_URL,
  });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 RPG Backend running on port ${PORT}`);
});