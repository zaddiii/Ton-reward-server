




import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import TonWeb from "tonweb";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ------------------- ENV CHECK -------------------
const required = [
  "TON_PRIVATE_KEY",
  "TON_WALLET_ADDRESS",
  "TONCENTER_API_KEY",
  "TONCENTER_API_URL",
  "JETTON_MASTER",
];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

// ------------------- TON SETUP -------------------
const tonweb = new TonWeb(
  new TonWeb.HttpProvider(process.env.TONCENTER_API_URL, {
    apiKey: process.env.TONCENTER_API_KEY,
  })
);

try {
  const walletBase64 = process.env.TON_PRIVATE_KEY;
  const seed = TonWeb.utils.base64ToBytes(walletBase64);
  const keyPair = TonWeb.utils.keyPairFromSeed(seed);

  // ✅ Correct wallet class usage
  const WalletClass = TonWeb.wallet.v3R2;
  const wallet = new WalletClass(tonweb.provider, {
    publicKey: keyPair.publicKey,
  });

  console.log("✅ TON Wallet Address:", process.env.TON_WALLET_ADDRESS);
  console.log("✅ Jetton Master Contract:", process.env.JETTON_MASTER);
} catch (err) {
  console.error("❌ Failed to initialize TON wallet:", err);
  process.exit(1);
}

// ------------------- ROUTES -------------------
app.get("/", (req, res) => {
  res.json({
    status: "RPG TON Backend Online ✅",
    wallet: process.env.TON_WALLET_ADDRESS,
    jetton_master: process.env.JETTON_MASTER,
  });
});

// Example route to fetch wallet balance
app.get("/balance", async (req, res) => {
  try {
    const address = new TonWeb.utils.Address(process.env.TON_WALLET_ADDRESS);
    const balance = await tonweb.provider.getBalance(address.toString());
    res.json({
      wallet: process.env.TON_WALLET_ADDRESS,
      balance: TonWeb.utils.fromNano(balance),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch balance", details: err.message });
  }
});

// ------------------- SERVER -------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 RPG TON Backend running on port ${PORT}`);
});