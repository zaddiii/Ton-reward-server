




const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors()); // Allow all origins for testing
app.use(express.json()); // Parse JSON bodies

// Root route
app.get('/', (req, res) => {
  res.send('RPG Reward Backend is live!');
});

// Reward route
app.post('/api/reward', (req, res) => {
  const { to } = req.body;

  if (!to) {
    return res.status(400).json({ ok: false, error: 'Missing recipient address' });
  }

  // Simulate sending a reward (replace this with your blockchain logic later)
  const simulatedTx = `tx_${Math.floor(Math.random() * 1000000)}`;

  console.log(`Reward sent to: ${to}, tx: ${simulatedTx}`);

  return res.json({ ok: true, tx: simulatedTx });
});

// Start server
app.listen(PORT, () => {
  console.log(`RPG Reward Backend running on port ${PORT}`);
});