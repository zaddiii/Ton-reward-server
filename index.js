

const express = require("express");
const cors = require("cors");
const app = express();

app.use(express.json());

// ✅ FIX: Allow all origins for frontend testing
app.use(
  cors({
    origin: "*", // allow all origins
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

const PORT = process.env.PORT || 3000;

app.post("/api/reward", (req, res) => {
  const { to, score } = req.body;
  console.log(`Reward request from: ${to}, score: ${score}`);

  res.json({
    ok: true,
    tx: "SIMULATED_TX_HASH",
    message: `Reward successfully processed for ${to} with score ${score}`,
    backend: "https://rpg-backend-gocj.onrender.com",
  });
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));