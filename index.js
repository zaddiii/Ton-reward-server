


const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const app = express();

dotenv.config();
app.use(express.json());

// ✅ Allow requests from your GitHub Pages frontend
app.use(cors({
  origin: ["https://zaddiii.github.io", "http://localhost:3000"],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
}));

// ✅ Simple test route
app.get("/", (req, res) => {
  res.send("Backend running successfully 🟢");
});

// ✅ Reward endpoint
app.post("/api/reward", (req, res) => {
  const { user, amount } = req.body;
  console.log(`Reward requested for ${user} with ${amount}`);

  res.json({
    ok: true,
    message: "Reward successfully processed",
    tx: "SIMULATED_TX_HASH",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));