





import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import TonWeb from "tonweb";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// === TON SETUP ===
const tonweb = new TonWeb(
  new TonWeb.HttpProvider("https://testnet.toncenter.com/api/v2/jsonRPC")
);

const PRIVATE_KEY_BASE64 = process.env.TON_PRIVATE_KEY;
const WALLET_ADDRESS = process.env.TON_WALLET_ADDRESS;
const JETTON_MASTER = process.env.JETTON_MASTER_ADDRESS; // RPG Jetton master address

if (!PRIVATE_KEY_BASE64 || !WALLET_ADDRESS) {
  console.error("❌ Missing required env vars: TON_PRIVATE_KEY or TON_WALLET_ADDRESS");
  process.exit(1);
}

// Decode TON private key
const seed = Buffer.from(PRIVATE_KEY_BASE64, "base64");
if (seed.length !== 32) {
  console.error("❌ TON_PRIVATE_KEY must be a 32-byte base64 string");
  process.exit(1);
}

const keyPair = TonWeb.utils.nacl.sign.keyPair.fromSeed(seed);
console.log("🔐 TON private key loaded successfully");
console.log("📜 Wallet address:", WALLET_ADDRESS);

// === ROUTES ===

// Root
app.get("/", (req, res) => {
  res.send("✅ RPG TON Reward Server (Testnet) is running 🚀");
});

// Check backend wallet balance
app.get("/balance", async (req, res) => {
  try {
    const balanceNano = await tonweb.provider.getBalance(WALLET_ADDRESS);
    const balanceTon = TonWeb.utils.fromNano(balanceNano);
    res.json({ walletAddress: WALLET_ADDRESS, balance: `${balanceTon} TON` });
  } catch (err) {
    console.error("❌ Error fetching balance:", err);
    res.status(500).json({ error: "Failed to fetch balance" });
  }
});

// 🪙 SYNC WALLET — called by the RPG frontend
app.post("/sync", async (req, res) => {
  try {
    const { toAddress, tokens } = req.body;

    if (!toAddress || !tokens) {
      return res.status(400).json({ error: "Missing toAddress or tokens" });
    }

    console.log(`🪙 Sync request: sending ${tokens} RPG tokens to ${toAddress}`);

    // === Step 1: Load backend wallet
    const WalletClass =
      TonWeb.wallet.all?.v4R2 ||
      TonWeb.wallet.v4R2 ||
      TonWeb.wallet.WalletV4R2;

    const wallet = new WalletClass(tonweb.provider, {
      publicKey: keyPair.publicKey,
      workchain: 0,
    });

    const seqno = (await wallet.methods.seqno().call()) || 0;

    // === Step 2: Prepare Jetton (RPG token) transfer payload
    if (!JETTON_MASTER) {
      return res.status(500).json({ error: "Missing JETTON_MASTER_ADDRESS in .env" });
    }

    const jettonMaster = new TonWeb.token.jetton.JettonMinter(tonweb.provider, {
      address: JETTON_MASTER,
    });

    // Get backend's Jetton wallet address
    const jettonWallet = await jettonMaster.getWalletAddress(WALLET_ADDRESS);

    // Convert tokens (RPG units) to nanoJettons (1 RPG = 1e9 nano)
    const jettonAmount = TonWeb.utils.toNano(tokens.toString());

    // === Address Fix (accepts both EQ... and 0Q... forms)
    let destination;
    try {
      destination = new TonWeb.utils.Address(toAddress);
    } catch {
      try {
        destination = TonWeb.Address.parseFriendly(toAddress).address;
      } catch {
        return res.status(400).json({ error: "Invalid TON address format" });
      }
    }

    const payload = await jettonMaster.createTransferBody({
      jettonAmount,
      toAddress: destination,
      responseAddress: WALLET_ADDRESS,
      forwardAmount: TonWeb.utils.toNano("0.02"),
      forwardPayload: new TextEncoder().encode("RPG Reward 🪙"),
    });

    // === Step 3: Send Jettons
    await wallet.methods
      .transfer({
        secretKey: keyPair.secretKey,
        toAddress: jettonWallet.toString(),
        amount: TonWeb.utils.toNano("0.05"), // TON fee
        seqno,
        payload,
        sendMode: 3,
      })
      .send();

    console.log(`✅ Successfully sent ${tokens} RPG tokens to ${toAddress}`);

    res.json({
      success: true,
      message: `Sent ${tokens} RPG tokens`,
      to: toAddress,
    });
  } catch (err) {
    console.error("❌ Sync/Reward error:", err);
    res.status(500).json({ error: "Failed to send RPG tokens" });
  }
});

// === START SERVER ===
const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(`✅ TON Reward Server running on port ${PORT}`)
);