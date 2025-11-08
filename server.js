



import express from "express";
import dotenv from "dotenv";
import TonWeb from "tonweb";
import { mnemonicToKeyPair } from "tonweb-mnemonic";

dotenv.config();

const app = express();
app.use(express.json());

const tonweb = new TonWeb(new TonWeb.HttpProvider("https://toncenter.com/api/v2/jsonRPC"));

// Initialize TON wallet safely
let wallet;
(async () => {
  try {
    const seedPhrase = process.env.WALLET_SEED_PHRASE;
    if (!seedPhrase) {
      throw new Error("Missing WALLET_SEED_PHRASE in .env");
    }

    const keyPair = await mnemonicToKeyPair(seedPhrase.split(" "));

    const WalletClass = tonweb.wallet.all.v3R2;
    wallet = new WalletClass(tonweb.provider, {
      publicKey: keyPair.publicKey,
    });

    const walletAddress = await wallet.getAddress();

    console.log("✅ TON Wallet successfully initialized");
    console.log("📜 Wallet Address:", walletAddress.toString(true, true, true));
    console.log("🏦 Jetton Master:", process.env.JETTON_MASTER);
  } catch (error) {
    console.error("❌ Failed to initialize TON wallet:", error);
    process.exit(1);
  }
})();

// Example route
app.get("/", (req, res) => {
  res.send("TON Reward Server is running successfully 🚀");
});

// Live prices or other endpoints
app.get("/prices", async (req, res) => {
  res.json({ status: "live", time: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));