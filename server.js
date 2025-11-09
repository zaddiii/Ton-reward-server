




import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import TonWeb from "tonweb";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const tonweb = new TonWeb(
  new TonWeb.HttpProvider("https://testnet.toncenter.com/api/v2/jsonRPC")
);

// ✅ Load from environment
const PRIVATE_KEY_BASE64 = process.env.TON_PRIVATE_KEY;
const WALLET_ADDRESS = process.env.TON_WALLET_ADDRESS; // ← use your real testnet wallet address here

if (!PRIVATE_KEY_BASE64) {
  console.error("❌ Missing TON_PRIVATE_KEY in .env");
  process.exit(1);
}

if (!WALLET_ADDRESS) {
  console.error("❌ Missing TON_WALLET_ADDRESS in .env");
  process.exit(1);
}

// ✅ Decode and load key
const seed = Buffer.from(PRIVATE_KEY_BASE64, "base64");
if (seed.length !== 32) {
  console.error("❌ TON_PRIVATE_KEY must be a 32-byte base64 string");
  process.exit(1);
}

const keyPair = TonWeb.utils.nacl.sign.keyPair.fromSeed(seed);
console.log("🔐 Loaded TON private key for signing transactions");

// ✅ Use your existing wallet address
const walletAddress = WALLET_ADDRESS.trim();
console.log("📜 Using provided wallet address:", walletAddress);

app.get("/", (req, res) => {
  res.send("✅ TON Reward Server (Testnet) is running 🚀");
});

app.get("/balance", async (req, res) => {
  try {
    const balanceNano = await tonweb.provider.getBalance(walletAddress);
    const balanceTon = TonWeb.utils.fromNano(balanceNano);
    res.json({
      walletAddress,
      balance: `${balanceTon} TON`,
    });
  } catch (err) {
    console.error("❌ Error fetching balance:", err);
    res.status(500).json({ error: "Failed to fetch balance" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ TON Reward Server running on port ${PORT}`)
);