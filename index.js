




// Load environment variables from .env
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('Backend is running 🎉');
});

// Example reward route
app.post('/reward', (req, res) => {
  const { user, amount } = req.body;
  if (!user || !amount) {
    return res.status(400).json({ error: 'Missing user or amount' });
  }
  // Here you can integrate TON SDK / database
  res.json({ message: `Rewarded ${amount} to ${user}` });
});

// Use dynamic port for Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});