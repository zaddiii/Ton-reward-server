




// server.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import TonWeb from "tonweb";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Required envs
const required = [
  "TON_PRIVATE_KEY",      // base64 of 32-byte seed
  "TON_WALLET_ADDRESS",   // the wallet address you want the server to use
  "TONCENTER_API_KEY",
  "TONCENTER_API_URL",
  "JETTON_MASTER"         // optional, but included in checks
];

const missing = required.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error("❌ Missing required env vars:", missing.join(", "));
  process.exit(1);
}

// TonWeb provider
const tonweb = new TonWeb(
  new TonWeb.HttpProvider(process.env.TONCENTER_API_URL, {
    apiKey: process.env.TONCENTER_API_KEY
  })
);

// Load 32-byte base64 seed and create keyPair
let keyPair;
try {
  const seedBase64 = process.env.TON_PRIVATE_KEY.trim();
  const seed = TonWeb.utils.base64ToBytes(seedBase64); // should be 32 bytes
  if (!seed || seed.length !== 32) {
    throw new Error(`TON_PRIVATE_KEY must be base64 of 32 bytes (found ${seed ? seed.length : 0}).`);
  }
  keyPair = TonWeb.utils.keyPairFromSeed(seed); // uses 32-byte seed
  console.log("🔐 Loaded 32-byte seed from TON_PRIVATE_KEY.");
} catch (err) {
  console.error("❌ Failed to load TON_PRIVATE_KEY:", err.message || err);
  process.exit(1);
}

// Instantiate wallet class (choose v4R2, fallback to v3R2)
let wallet;
try {
  const WalletClass = TonWeb.wallet.all?.v4R2 || TonWeb.wallet.v4R2 || TonWeb.wallet.v3R2;
  wallet = new WalletClass(tonweb.provider, { publicKey: keyPair.publicKey });
} catch (err) {
  console.error("❌ Failed to create wallet class:", err.message || err);
  process.exit(1);
}

// Compare derived address with provided env address
(async () => {
  try {
    const derivedAddr = (await wallet.getAddress()).toString(true, true, true);
    console.log("📜 Derived address (from seed):", derivedAddr);
    console.log("📍 TON_WALLET_ADDRESS (env):", process.env.TON_WALLET_ADDRESS);
    if (derivedAddr !== process.env.TON_WALLET_ADDRESS) {
      console.warn("⚠️ Derived address DOES NOT match TON_WALLET_ADDRESS env value.");
      console.warn("If you want the server to sign/send from the exact address in Tonkeeper, ensure TON_PRIVATE_KEY is the exact 32-byte seed used by that wallet.");
    } else {
      console.log("✅ Derived address matches TON_WALLET_ADDRESS.");
    }
  } catch (e) {
    console.warn("⚠️ Could not derive address:", e.message || e);
  }
})();

// --- Routes ---

app.get("/", (req, res) => {
  res.json({
    status: "RPG TON Backend online",
    wallet_env: process.env.TON_WALLET_ADDRESS,
    jetton_master: process.env.JETTON_MASTER
  });
});

app.get("/balance", async (req, res) => {
  try {
    const address = process.env.TON_WALLET_ADDRESS;
    const balanceNano = await tonweb.provider.getBalance(address);
    const balance = Number(balanceNano) / 1e9;
    res.json({ address, balance });
  } catch (err) {
    console.error("Balance fetch error:", err);
    res.status(500).json({ error: "Failed to fetch balance", details: err.message });
  }
});

// Transfer TON (will sign with the keyPair derived above)
app.post("/transfer", async (req, res) => {
  try {
    const { toAddress, amountTon } = req.body;
    if (!toAddress || !amountTon) return res.status(400).json({ error: "Missing toAddress or amountTon" });

    const seqno = await wallet.methods.seqno().call();
    const amount = TonWeb.utils.toNano(amountTon);

    const transfer = wallet.methods.transfer({
      secretKey: keyPair.secretKey,
      toAddress,
      amount,
      seqno,
      payload: "RPG Reward",
      sendMode: 3
    });

    await transfer.send();

    res.json({ success: true, message: `Sent ${amountTon} TON to ${toAddress}` });
  } catch (err) {
    console.error("Transfer failed:", err);
    res.status(500).json({ error: "Transfer failed", details: err.message });
  }
});

// Transactions log endpoint (optional simple implementation)
app.get("/transactions", (req, res) => {
  // If you keep a file-based log, you can read and return it here.
  res.json({ message: "No stored transactions (optional)"} );
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));