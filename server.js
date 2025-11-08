




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

let wallet;
let walletAddress;

(async () => {
  try {
    const privateKeyBase64 = process.env.TON_PRIVATE_KEY;
    if (!privateKeyBase64) {
      throw new Error("Missing TON_PRIVATE_KEY in environment variables");
    }

    const seed = Buffer.from(privateKeyBase64, "base64");
    if (seed.length !== 32) {
      throw new Error(
        `TON_PRIVATE_KEY must be base64 of 32 bytes (found ${seed.length}).`
      );
    }

    console.log("🔐 Loaded 32-byte seed from TON_PRIVATE_KEY.");
    const keyPair = TonWeb.utils.nacl.sign.keyPair.fromSeed(seed);

    // ✅ Detect wallet class across all TonWeb versions
    const WalletClass =
      TonWeb.wallet?.Wallets?.WalletV4R2 || // v0.0.60+
      TonWeb.wallet?.all?.v4R2 ||           // legacy
      TonWeb.wallet?.WalletV4R2 ||          // legacy alt
      TonWeb.wallet?.v4R2 ||                // legacy alt
      TonWeb.wallet?.WalletV3R2 ||          // fallback
      TonWeb.wallet?.Wallets?.WalletV3R2;   // new path fallback

    if (!WalletClass) {
      throw new Error("No compatible TonWeb wallet class found.");
    }

    // ✅ Initialize wallet
    wallet = new WalletClass(tonweb.provider, {
      publicKey: keyPair.publicKey,
      workchain: 0,
    });

    walletAddress = await wallet.getAddress();

    console.log("✅ TON Wallet successfully initialized");
    console.log("📜 Wallet Address:", walletAddress.toString(true, true, true));
  } catch (error) {
    console.error("❌ Failed to create wallet class:", error);
    process.exit(1);
  }
})();

app.get("/", (req, res) => {
  res.send("TON Reward Server is running successfully 🚀");
});

app.get("/balance", async (req, res) => {
  try {
    if (!walletAddress) {
      return res.status(500).json({ error: "Wallet not initialized yet." });
    }

    const balanceNano = await tonweb.provider.getBalance(walletAddress.toString(true, true, true));
    const balanceTon = TonWeb.utils.fromNano(balanceNano);

    res.json({
      walletAddress: walletAddress.toString(true, true, true),
      balance: `${balanceTon} TON`,
    });
  } catch (error) {
    console.error("❌ Error fetching balance:", error);
    res.status(500).json({ error: "Failed to fetch balance" });
  }
});

app.get("/prices", (req, res) => {
  res.json({ status: "live", time: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));