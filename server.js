



import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import TonWeb from "tonweb";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ Use TON testnet endpoint
const tonweb = new TonWeb(
  new TonWeb.HttpProvider("https://testnet.toncenter.com/api/v2/jsonRPC")
);

let wallet;
let walletAddress;

(async () => {
  try {
    const privateKeyBase64 = process.env.TON_PRIVATE_KEY;
    if (!privateKeyBase64) throw new Error("Missing TON_PRIVATE_KEY in .env");

    const seed = Buffer.from(privateKeyBase64, "base64");
    if (seed.length !== 32)
      throw new Error("TON_PRIVATE_KEY must be 32 bytes (base64 encoded).");

    console.log("🔐 Loaded 32-byte seed from TON_PRIVATE_KEY.");
    const keyPair = TonWeb.utils.nacl.sign.keyPair.fromSeed(seed);

    // ✅ Explicitly use WalletV4R2 for Tonkeeper compatibility
    wallet = new TonWeb.wallet.all.v4R2(tonweb.provider, {
      publicKey: keyPair.publicKey,
      wc: -1, // -1 = testnet
    });

    walletAddress = await wallet.getAddress();
    console.log("✅ TON Wallet successfully initialized (TESTNET)");
    console.log("📜 Wallet Address:", walletAddress.toString(true, true, true));
  } catch (err) {
    console.error("❌ Failed to create wallet class:", err);
    process.exit(1);
  }
})();

app.get("/", (req, res) => res.send("🚀 TON Reward Server (Testnet) is running"));

app.get("/balance", async (req, res) => {
  try {
    if (!walletAddress)
      return res.status(500).json({ error: "Wallet not initialized yet." });

    const balanceNano = await tonweb.provider.getBalance(
      walletAddress.toString(true, true, true)
    );
    const balanceTon = TonWeb.utils.fromNano(balanceNano);

    res.json({
      walletAddress: walletAddress.toString(true, true, true),
      balance: `${balanceTon} TON (testnet)`,
    });
  } catch (err) {
    console.error("❌ Error fetching balance:", err);
    res.status(500).json({ error: "Failed to fetch balance" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));