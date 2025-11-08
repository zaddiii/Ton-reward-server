



import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import TonWeb from "tonweb";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

/* ------------------- ENVIRONMENT CHECK ------------------- */
const required = [
  "TON_PRIVATE_KEY",
  "TON_WALLET_ADDRESS",
  "TONCENTER_API_KEY",
  "TONCENTER_API_URL",
  "JETTON_MASTER",
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`❌ Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

/* ------------------- TON SETUP ------------------- */
const tonweb = new TonWeb(
  new TonWeb.HttpProvider(process.env.TONCENTER_API_URL, {
    apiKey: process.env.TONCENTER_API_KEY,
  })
);

let wallet;
try {
  const walletBase64 = process.env.TON_PRIVATE_KEY;
  const seed = TonWeb.utils.base64ToBytes(walletBase64);

  // ✅ For 64-byte secret keys
  const keyPair = TonWeb.utils.keyPairFromSecretKey(seed);

  const WalletClass = TonWeb.wallet.v3R2;
  wallet = new WalletClass(tonweb.provider, {
    publicKey: keyPair.publicKey,
  });

  console.log("✅ TON Wallet Address:", process.env.TON_WALLET_ADDRESS);
  console.log("✅ Jetton Master Contract:", process.env.JETTON_MASTER);
} catch (err) {
  console.error("❌ Failed to initialize TON wallet:", err);
  process.exit(1);
}

/* ------------------- EXPRESS ROUTES ------------------- */
app.get("/", (req, res) => {
  res.json({
    message: "🚀 RPG TON Backend is running",
    wallet: process.env.TON_WALLET_ADDRESS,
    jettonMaster: process.env.JETTON_MASTER,
  });
});

/* Example endpoint for checking balance */
app.get("/balance", async (req, res) => {
  try {
    const address = new TonWeb.utils.Address(process.env.TON_WALLET_ADDRESS);
    const balance = await tonweb.provider.getBalance(address);
    res.json({
      address: process.env.TON_WALLET_ADDRESS,
      balance: balance / 1e9 + " TON",
    });
  } catch (error) {
    console.error("❌ Balance fetch error:", error);
    res.status(500).json({ error: "Failed to fetch balance" });
  }
});

/* ------------------- SERVER LISTEN ------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 RPG TON Backend running on port ${PORT}`);
});