







// === server.js ===
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
const JETTON_MASTER = process.env.JETTON_MASTER_ADDRESS;

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
console.log("🔐 TON wallet ready:", WALLET_ADDRESS);

// === ROUTES ===

// 🟢 Root check
app.get("/", (req, res) => {
  res.send("✅ RPG TON Reward Server is live on Render 🚀");
});

// 💰 Get wallet balance
app.get("/balance", async (req, res) => {
  try {
    const balanceNano = await tonweb.provider.getBalance(WALLET_ADDRESS);
    const balanceTon = TonWeb.utils.fromNano(balanceNano);
    res.json({ address: WALLET_ADDRESS, balance: `${balanceTon} TON` });
  } catch (err) {
    console.error("❌ Error fetching balance:", err);
    res.status(500).json({ error: "Failed to fetch balance" });
  }
});

// 🪙 Sync route — RPG frontend calls this when user hits "Sync Wallet"
app.post("/sync", async (req, res) => {
  try {
    const { toAddress, tokens } = req.body;

    if (!toAddress || !tokens) {
      return res.status(400).json({ error: "Missing toAddress or tokens" });
    }

    console.log(`🔄 Sync request: ${tokens} tokens → ${toAddress}`);

    // Validate address
    let destination;
    try {
      destination = new TonWeb.utils.Address(toAddress);
    } catch {
      try {
        destination = TonWeb.Address.parseFriendly(toAddress).address;
      } catch {
        console.error("❌ Invalid TON address format:", toAddress);
        return res.status(400).json({ error: "Invalid TON address format" });
      }
    }

    // Load wallet
    const WalletClass =
      TonWeb.wallet.all?.v4R2 ||
      TonWeb.wallet.v4R2 ||
      TonWeb.wallet.WalletV4R2;

    const wallet = new WalletClass(tonweb.provider, {
      publicKey: keyPair.publicKey,
      workchain: 0,
    });

    const seqno = (await wallet.methods.seqno().call()) || 0;

    // Require Jetton Master
    if (!JETTON_MASTER) {
      return res.status(500).json({ error: "Missing JETTON_MASTER_ADDRESS in .env" });
    }

    // Load Jetton minter + wallet
    const jettonMinter = new TonWeb.token.jetton.JettonMinter(tonweb.provider, {
      address: JETTON_MASTER,
    });

    const jettonWalletAddress = await jettonMinter.getJettonWalletAddress(WALLET_ADDRESS);
    const jettonWallet = new TonWeb.token.jetton.JettonWallet(tonweb.provider, {
      address: jettonWalletAddress,
    });

    // Prepare transfer payload
    const jettonAmount = TonWeb.utils.toNano(tokens.toString());
    const payload = await jettonWallet.createTransferBody({
      jettonAmount,
      toAddress: destination,
      responseAddress: WALLET_ADDRESS,
      forwardAmount: TonWeb.utils.toNano("0.02"),
      forwardPayload: new TextEncoder().encode("RPG Reward 🪙"),
    });

    // Execute transfer
    await wallet.methods
      .transfer({
        secretKey: keyPair.secretKey,
        toAddress: jettonWalletAddress.toString(),
        amount: TonWeb.utils.toNano("0.05"), // fee
        seqno,
        payload,
        sendMode: 3,
      })
      .send();

    console.log(`✅ Sent ${tokens} RPG tokens to ${toAddress}`);
    res.json({ success: true, message: `Sent ${tokens} RPG tokens to ${toAddress}` });
  } catch (err) {
    console.error("❌ Sync error:", err);
    res.status(500).json({ error: "Failed to sync wallet" });
  }
});

// === START SERVER ===
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 RPG TON Reward Server running on port ${PORT}`);
});