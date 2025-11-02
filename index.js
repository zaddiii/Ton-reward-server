


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


document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = 'https://rpg-backend-gocj.onrender.com';

  // Only create the reward UI if it doesn't exist
  if (!document.getElementById('rewardContainer')) {
    const container = document.createElement('div');
    container.id = 'rewardContainer';

    // Basic styling to blend with typical boilerplate
    container.style.padding = '15px';
    container.style.marginTop = '20px';
    container.style.border = '1px solid #ccc';
    container.style.borderRadius = '10px';
    container.style.backgroundColor = '#f9f9f9';
    container.style.maxWidth = '400px';
    container.style.fontFamily = 'inherit';
    container.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';

    container.innerHTML = `
      <h2 style="margin-top:0;">Send Reward</h2>
      <label for="rewardUser">Recipient:</label><br>
      <input type="text" id="rewardUser" placeholder="Enter username" style="width: 100%; padding: 6px; margin: 5px 0;"><br>
      <label for="rewardScore">Score:</label><br>
      <input type="number" id="rewardScore" placeholder="Enter score" style="width: 100%; padding: 6px; margin: 5px 0;"><br>
      <button id="rewardBtn" style="padding: 8px 12px; margin-top: 10px; cursor: pointer; border-radius: 5px; border: none; background-color: #4CAF50; color: white;">Send Reward</button>
      <div id="rewardResult" style="margin-top: 10px; font-weight: bold;"></div>
    `;

    // Append to body or any specific container in your boilerplate
    document.body.appendChild(container);
  }

  // Function to send reward
  function sendReward(to, score) {
    fetch(`${API_BASE}/api/reward`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, score })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Reward response:', data);
      document.getElementById('rewardResult').innerText =
        `Reward sent! Transaction: ${data.tx}`;
    })
    .catch(err => {
      console.error('Error sending reward:', err);
      document.getElementById('rewardResult').innerText = 'Failed to send reward.';
    });
  }

  // Attach click event
  const rewardBtn = document.getElementById('rewardBtn');
  rewardBtn.addEventListener('click', () => {
    const user = document.getElementById('rewardUser').value;
    const score = Number(document.getElementById('rewardScore').value);

    if (!user || !score) {
      alert('Please enter both recipient and score.');
      return;
    }

    sendReward(user, score);
  });
});