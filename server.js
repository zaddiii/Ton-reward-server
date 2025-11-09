




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

// 🪙 SYNC WALLET — RPG frontend calls this
app.post("/reward", async (req, res) => {
  try {
    const { toAddress, amount } = req.body;

    if (!toAddress || !amount) {
      return res.status(400).json({ error: "Missing toAddress or amount" });
    }

    console.log(`🪙 Reward: Sending ${amount} RPG tokens to ${toAddress}`);

    // === Step 1: Validate TON address (accept all valid formats)
    let destination;
    try {
      destination = new TonWeb.utils.Address(toAddress);
    } catch (e) {
      try {
        destination = TonWeb.Address.parseFriendly(toAddress).address;
      } catch {
        console.error("❌ Invalid TON address format:", toAddress);
        return res.status(400).json({ error: "Invalid TON address format" });
      }
    }

    // === Step 2: Load backend wallet
    const WalletClass =
      TonWeb.wallet.all?.v4R2 ||
      TonWeb.wallet.v4R2 ||
      TonWeb.wallet.WalletV4R2;

    const wallet = new WalletClass(tonweb.provider, {
      publicKey: keyPair.publicKey,
      workchain: 0,
    });

    const seqno = (await wallet.methods.seqno().call()) || 0;

    // === Step 3: Load Jetton master and sender’s jetton wallet
    if (!JETTON_MASTER) {
      return res.status(500).json({ error: "Missing JETTON_MASTER_ADDRESS in .env" });
    }

    const jettonMinter = new TonWeb.token.jetton.JettonMinter(tonweb.provider, {
      address: JETTON_MASTER,
    });

    const jettonWalletAddress = await jettonMinter.getJettonWalletAddress(WALLET_ADDRESS);
    const jettonWallet = new TonWeb.token.jetton.JettonWallet(tonweb.provider, {
      address: jettonWalletAddress,
    });

    // === Step 4: Create payload to transfer tokens
    const jettonAmount = TonWeb.utils.toNano(amount.toString());
    const payload = await jettonWallet.createTransferBody({
      jettonAmount,
      toAddress: destination,
      responseAddress: WALLET_ADDRESS,
      forwardAmount: TonWeb.utils.toNano("0.02"),
      forwardPayload: new TextEncoder().encode("RPG Reward 🪙"),
    });

    // === Step 5: Send the transaction
    await wallet.methods
      .transfer({
        secretKey: keyPair.secretKey,
        toAddress: jettonWalletAddress.toString(),
        amount: TonWeb.utils.toNano("0.05"), // TON fee
        seqno,
        payload,
        sendMode: 3,
      })
      .send();

    console.log(`✅ Successfully sent ${amount} RPG tokens to ${toAddress}`);

    res.json({
      success: true,
      message: `Sent ${amount} RPG tokens to ${toAddress}`,
    });
  } catch (err) {
    console.error("❌ Reward error:", err);
    res.status(500).json({ error: "Failed to send RPG tokens" });
  }
});

// === START SERVER ===
const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(`✅ TON Reward Server running on port ${PORT}`)
);