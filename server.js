



import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import TonWeb from "tonweb";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

/* ------------------- TON SETUP ------------------- */

if (
  !process.env.TON_PRIVATE_KEY ||
  !process.env.TON_WALLET_ADDRESS ||
  !process.env.TONCENTER_API_KEY ||
  !process.env.TONCENTER_API_URL
) {
  console.error("❌ Missing one or more required environment variables.");
  console.error(
    "Please set TON_PRIVATE_KEY, TON_WALLET_ADDRESS, TONCENTER_API_KEY, TONCENTER_API_URL."
  );
  process.exit(1);
}

const tonweb = new TonWeb(
  new TonWeb.HttpProvider(process.env.TONCENTER_API_URL, {
    apiKey: process.env.TONCENTER_API_KEY,
  })
);

// Load keypair and wallet
let keyPair, wallet;
try {
  const seedOrSecret = TonWeb.utils.base64ToBytes(process.env.TON_PRIVATE_KEY);
  const seed = seedOrSecret.length === 64 ? seedOrSecret.slice(0, 32) : seedOrSecret;

  keyPair = TonWeb.utils.keyPairFromSeed(seed);
  const WalletClass = TonWeb.wallet.all["v3R2"];
  wallet = new WalletClass(tonweb.provider, { publicKey: keyPair.publicKey });

  (async () => {
    const address = await wallet.getAddress();
    console.log("✅ Loaded Wallet Address:", address.toString(true, true, true));
  })();
} catch (err) {
  console.error("❌ Failed to initialize TON wallet:", err);
  process.exit(1);
}

/* ------------------- FILE HELPERS ------------------- */
const logFile = "./transactions.json";
if (!fs.existsSync(logFile)) fs.writeFileSync(logFile, "[]", "utf8");

function logTransaction(data) {
  const logs = JSON.parse(fs.readFileSync(logFile, "utf8"));
  logs.push({ id: Date.now(), ...data, timestamp: new Date().toISOString() });
  fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
}

/* ------------------- ROUTES ------------------- */

// 🧾 Get backend wallet balance
app.get("/api/wallet", async (req, res) => {
  try {
    const address = process.env.TON_WALLET_ADDRESS;
    const balance = await tonweb.getBalance(address);
    res.json({ address, balance: Number(balance) / 1e9 });
  } catch (err) {
    console.error("❌ Error fetching wallet:", err);
    res.status(500).json({ error: "Failed to fetch wallet info" });
  }
});

// 💸 Handle token transfer
app.post("/api/transfer", async (req, res) => {
  const { toAddress, amountTon } = req.body;
  if (!toAddress || !amountTon)
    return res.status(400).json({ error: "Missing toAddress or amountTon" });

  try {
    const amount = TonWeb.utils.toNano(amountTon);
    const seqno = await wallet.methods.seqno().call();

    const transfer = wallet.methods.transfer({
      secretKey: keyPair.secretKey,
      toAddress,
      amount,
      seqno,
      payload: "RPG Game Reward",
      sendMode: 3,
    });

    await transfer.send();

    const record = { to: toAddress, amountTon, status: "success" };
    logTransaction(record);
    res.json({ success: true, message: `Sent ${amountTon} TON to ${toAddress}` });
  } catch (err) {
    console.error("❌ Transfer failed:", err);
    const record = { to: toAddress, amountTon, status: "failed", error: err.message };
    logTransaction(record);
    res.status(500).json({ error: "Transfer failed", details: err.message });
  }
});

// 📜 Get all transaction logs
app.get("/api/transactions", (req, res) => {
  try {
    const logs = JSON.parse(fs.readFileSync(logFile, "utf8"));
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to read transaction log" });
  }
});

/* ------------------- SERVER ------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 RPG TON Backend running on port ${PORT} (${new Date().toLocaleString()})`)
);