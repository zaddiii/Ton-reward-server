



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
const tonweb = new TonWeb(new TonWeb.HttpProvider("https://toncenter.com/api/v2/jsonRPC"));
const seed = TonWeb.utils.base64ToBytes(process.env.TON_PRIVATE_KEY);
const keyPair = TonWeb.utils.keyPairFromSeed(seed);
const WalletClass = TonWeb.wallet.all["v3R2"];
const wallet = new WalletClass(tonweb.provider, { publicKey: keyPair.publicKey });

console.log("✅ RPG Backend Wallet Address:", process.env.TON_WALLET_ADDRESS);

/* ------------------- FILE HELPERS ------------------- */
const logFile = "./transactions.json";

// Ensure transactions log exists
if (!fs.existsSync(logFile)) fs.writeFileSync(logFile, "[]", "utf8");

function logTransaction(data) {
  const logs = JSON.parse(fs.readFileSync(logFile, "utf8"));
  logs.push({
    id: Date.now(),
    ...data,
    timestamp: new Date().toISOString(),
  });
  fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
}

/* ------------------- ROUTES ------------------- */

// 🧾 Fetch backend wallet balance
app.get("/api/wallet", async (req, res) => {
  try {
    const balance = await tonweb.getBalance(process.env.TON_WALLET_ADDRESS);
    res.json({
      address: process.env.TON_WALLET_ADDRESS,
      balance: Number(balance) / 1e9, // convert nanotons → TON
    });
  } catch (err) {
    console.error("❌ Error fetching wallet:", err);
    res.status(500).json({ error: "Failed to fetch wallet info" });
  }
});

// 💸 Handle token transfer + log it
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

    const record = {
      to: toAddress,
      amountTon,
      status: "success",
      txHash: `tx-${Date.now()}`,
    };
    logTransaction(record);

    res.json({
      success: true,
      message: `Sent ${amountTon} TON to ${toAddress}`,
      record,
    });
  } catch (err) {
    console.error("❌ Transfer failed:", err);

    const record = {
      to: toAddress,
      amountTon,
      status: "failed",
      error: err.message,
    };
    logTransaction(record);

    res.status(500).json({
      error: "Transfer failed",
      details: err.message,
    });
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