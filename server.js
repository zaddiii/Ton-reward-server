



const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.post('/api/reward', (req, res) => {
  const { to, score } = req.body;
  console.log(`Reward request from: ${to}, score: ${score}`);
  // Simulate reward logic
  res.json({ ok: true, tx: "SIMULATED_TX_HASH" });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));