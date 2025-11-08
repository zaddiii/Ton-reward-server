





import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import TonWeb from "tonweb";
import dotenv from "dotenv";
import nacl from "tweetnacl";
import fs from "fs";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

/* ------------------- TON SETUP ------------------- */
const tonweb = new TonWeb(new TonWeb.HttpProvider("https://toncenter.com/api/v2/jsonRPC"));

// Helpers
function bufToBase64(buf) {
  return Buffer.from(buf).toString("base64");
}
function bufToHex(buf) {
  return Buffer.from(buf).toString("hex");
}

let walletBase64 = process.env.TON_PRIVATE_KEY;
let keyPair, wallet;

if (!walletBase64) {
  console.warn("⚠️ TON_PRIVATE_KEY env var not found.");
  console.warn("Generating a new programmatic keypair for DEV only — copy it and save it securely!");

  const kp = nacl.sign.keyPair();
  const secretKey64 = Buffer.from(kp.secretKey); // 64 bytes
  const seed32 = secretKey64.slice(0, 32); // 32 bytes
  walletBase64 = bufToBase64(secretKey64);

  // Save locally (dev only)
  try {
    fs.writeFileSync(
      ".local_wallet",
      JSON.stringify(
        {
          base64_secret_key64: walletBase64,
          base64_seed32: bufToBase64(seed32),
          hex_public_key: bufToHex(kp.publicKey),
        },
        null,
        2
      ),
      { flag: "w", encoding: "utf8" }
    );
    console.log("📝 Wrote .local_wallet (dev only) — do NOT commit this file!");
  } catch (e) {
    console.warn("⚠️ Could not write .local_wallet:", e.message);
  }

  console.log("\n=== NEW DEV KEY GENERATED ===");
  console.log("Copy this base64 value into your Render env as TON_PRIVATE_KEY:");
  console.log(walletBase64);
  console.log("=== END ===\n");
}

try {
  const seedOrSecret = TonWeb.utils.base64ToBytes(walletBase64);
  const seed = seedOrSecret.length === 64 ? seedOrSecret.slice(0, 32) : seedOrSecret;

  keyPair = TonWeb.utils.keyPairFromSeed(seed);
  const WalletClass = TonWeb.wallet.all["v3R2"];
  wallet = new WalletClass(tonweb.provider, { publicKey: keyPair.publicKey });

  (async () => {
    try {
      const address = await wallet.getAddress();
      console.log("✅ RPG Backend Wallet Address:", address.toString(true, true, true));
      console.log("👉 Set TON_WALLET_ADDRESS in Render to this value.\n");
    } catch (e) {
      console.error("❌ Could not auto-derive wallet address:", e);
    }
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

// 🧾 Fetch backend wallet balance
app.get("/api/wallet", async (req, res) => {
  try {
    const address = process.env.TON_WALLET_ADDRESS || (await wallet.getAddress()).toString(true, true, true);
    const balance = await tonweb.getBalance(address);
    res.json({ address, balance: Number(balance) / 1e9 });
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

    const record = { to: toAddress, amountTon, status: "success", txHash: `tx-${Date.now()}` };
    logTransaction(record);
    res.json({ success: true, message: `Sent ${amountTon} TON to ${toAddress}`, record });
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