



import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import TonWeb from "tonweb";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ Initialize TonWeb with TON Center API
const tonweb = new TonWeb(
  new TonWeb.HttpProvider("https://toncenter.com/api/v2/jsonRPC")
);

// ✅ Initialize TON wallet safely
let wallet;

(async () => {
  try {
    const privateKeyBase64 = process.env.TON_PRIVATE_KEY;
    if (!privateKeyBase64) {
      throw new Error("Missing TON_PRIVATE_KEY in environment variables");
    }

    // Decode Base64 -> 32-byte seed buffer
    const seed = Buffer.from(privateKeyBase64, "base64");
    if (seed.length !== 32) {
      throw new Error(
        `TON_PRIVATE_KEY must be base64 of 32 bytes (found ${seed.length}).`
      );
    }

    console.log("🔐 Loaded 32-byte seed from TON_PRIVATE_KEY.");

    // Derive public/private keypair
    const keyPair = TonWeb.utils.nacl.sign.keyPair.fromSeed(seed);

    // ✅ Use the modern wallet class
    const WalletClass = TonWeb.wallet.WalletV4R2;

    wallet = new WalletClass(tonweb.provider, {
      publicKey: keyPair.publicKey,
    });

    const walletAddress = await wallet.getAddress();

    console.log("✅ TON Wallet successfully initialized");
    console.log("📜 Wallet Address:", walletAddress.toString(true, true, true));

  } catch (error) {
    console.error("❌ Failed to create wallet class:", error);
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