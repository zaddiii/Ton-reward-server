




import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import TonWeb from "tonweb";
import dotenv from "dotenv";
import fs from "fs";

// ✅ Correct import for CommonJS tonweb-mnemonic
import pkg from "tonweb-mnemonic";
const { mnemonicToKeyPair } = pkg;

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ Initialize TonWeb with TON Center API
const tonweb = new TonWeb(new TonWeb.HttpProvider("https://toncenter.com/api/v2/jsonRPC"));

// ✅ Initialize TON wallet safely
let wallet;
(async () => {
  try {
    const seedPhrase = process.env.WALLET_SEED_PHRASE;
    if (!seedPhrase) {
      throw new Error("Missing WALLET_SEED_PHRASE in environment variables");
    }

    const keyPair = await mnemonicToKeyPair(seedPhrase.split(" "));
    const WalletClass = tonweb.wallet.all.v4R2;

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

// ✅ Root route
app.get("/", (req, res) => {
  res.send("TON Reward Server is running successfully 🚀");
});

// ✅ Example endpoint (fetch live prices or data)
app.get("/prices", async (req, res) => {
  res.json({ status: "live", time: new Date().toISOString() });
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));