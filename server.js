




// server.js
import express from "express";
import dotenv from "dotenv";
import TonWeb from "tonweb";

dotenv.config();
const app = express();
const port = process.env.PORT || 10000;

app.use(express.json());

// ✅ TONWeb setup (mainnet)
const tonweb = new TonWeb(new TonWeb.HttpProvider("https://toncenter.com/api/v2/jsonRPC"));
let wallet, walletAddress;

// ⚙️ Wallet initialization
(async () => {
  try {
    const privateKeyBase64 = process.env.TON_PRIVATE_KEY;
    if (!privateKeyBase64) throw new Error("Missing TON_PRIVATE_KEY in environment variables");

    // Decode Base64 → 32-byte seed
    const seed = Buffer.from(privateKeyBase64, "base64");
    const seed32 = seed.length === 64 ? seed.subarray(0, 32) : seed;

    console.log(`🔐 Loaded ${seed32.length}-byte seed from TON_PRIVATE_KEY.`);

    const keyPair = TonWeb.utils.nacl.sign.keyPair.fromSeed(seed32);

    // ✅ Detect wallet class across TonWeb versions
    const walletClass =
      TonWeb.wallet.all?.v4R2 ||
      TonWeb.wallet.v4R2 ||
      TonWeb.wallet.WalletV4R2 ||
      TonWeb.wallet.WalletV4ContractR2;

    if (!walletClass) throw new Error("❌ Wallet class not found in TonWeb version.");

    wallet = new walletClass(tonweb.provider, {
      publicKey: keyPair.publicKey,
      workchain: 0,
    });

    walletAddress = await wallet.getAddress();

    console.log("✅ TON Wallet successfully initialized");
    console.log("📜 Wallet Address:", walletAddress.toString(true, true, true));
  } catch (err) {
    console.error("❌ Failed to initialize wallet:", err);
    process.exit(1);
  }
})();

// ✅ Simple health check route
app.get("/", (req, res) => {
  res.json({
    status: "running",
    wallet: walletAddress ? walletAddress.toString(true, true, true) : "initializing...",
  });
});

// ✅ Example route: get wallet balance
app.get("/balance", async (req, res) => {
  try {
    if (!walletAddress) return res.status(400).json({ error: "Wallet not initialized" });
    const balance = await tonweb.getBalance(walletAddress.toString(true, true, true));
    res.json({ wallet: walletAddress.toString(true, true, true), balance: balance / 1e9 + " TON" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Start the server
app.listen(port, () => {
  console.log(`🚀 Server live on port ${port}`);
});