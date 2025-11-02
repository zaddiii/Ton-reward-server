




require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

app.use(helmet());
app.use(cors({
  origin: [
    "https://zaddiii.github.io",
    "http://localhost:5173" 
  ]
}));
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.send('🚀 Scalable backend running smoothly');
});

app.post('/reward', async (req, res) => {
  const { user, amount } = req.body;
  if (!user || !amount) return res.status(400).json({ error: 'Missing data' });

  // Imagine reward processing here
  await new Promise(resolve => setTimeout(resolve, 200)); // fake async op
  res.json({ success: true, message: `Rewarded ${amount} tokens to ${user}` });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} 🌀`));