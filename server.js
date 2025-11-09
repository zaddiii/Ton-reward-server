



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
const JETTON_MASTER = process.env.JETTON_MASTER_ADDRESS; // RPG token master address

if (!PRIVATE_KEY_BASE64) {
  console.error("❌ Missing TON_PRIVATE_KEY in .env");
  process.exit(1);
}

if (!WALLET_ADDRESS) {
  console.error("❌ Missing TON_WALLET_ADDRESS in .env");
  process.exit(1);
}

// ✅ Decode and load key
const seed = Buffer.from(PRIVATE_KEY_BASE64, "base64");
if (seed.length !== 32) {
  console.error("❌ TON_PRIVATE_KEY must be a 32-byte base64 string");
  process.exit(1);
}

const keyPair = TonWeb.utils.nacl.sign.keyPair.fromSeed(seed);
console.log("🔐 Loaded TON private key for signing transactions");

// ✅ Use your provided wallet address
const walletAddress = WALLET_ADDRESS.trim();
console.log("📜 Using provided wallet address:", walletAddress);

// === ROUTES ===
app.get("/", (req, res) => {
  res.send("✅ TON Reward Server (Testnet) is running 🚀");
});

// 💰 Check balance
app.get("/balance", async (req, res) => {
  try {
    const balanceNano = await tonweb.provider.getBalance(walletAddress);
    const balanceTon = TonWeb.utils.fromNano(balanceNano);
    res.json({
      walletAddress,
      balance: `${balanceTon} TON`,
    });
  } catch (err) {
    console.error("❌ Error fetching balance:", err);
    res.status(500).json({ error: "Failed to fetch balance" });
  }
});

// 🪙 Wallet sync endpoint (for your game)
app.post("/sync", (req, res) => {
  try {
    const wallet = req.body;
    console.log("🪙 Wallet sync received:", wallet);

    // You can store or process the wallet data here later
    res.json({ status: "ok", message: "Wallet synced successfully!" });
  } catch (err) {
    console.error("❌ Error syncing wallet:", err);
    res.status(500).json({ error: "Wallet sync failed" });
  }
});

// 🎮 Reward endpoint — send Jetton token (RPG)
app.post("/reward", async (req, res) => {
  try {
    const { toAddress, amount } = req.body;
    if (!toAddress || !amount) {
      return res.status(400).json({ error: "Missing toAddress or amount" });
    }

    if (!JETTON_MASTER) {
      return res.status(500).json({ error: "Missing JETTON_MASTER_ADDRESS in .env" });
    }

    // Load wallet contract
    const WalletClass =
      TonWeb.wallet.all?.v4R2 ||
      TonWeb.wallet.v4R2 ||
      TonWeb.wallet.WalletV4R2;
    const wallet = new WalletClass(tonweb.provider, {
      publicKey: keyPair.publicKey,
      workchain: 0,
    });

    const seqno = await wallet.methods.seqno().call();

    // 🔁 Jetton transfer payload
    const jettonAmount = TonWeb.utils.toNano(amount);
    const destination = new TonWeb.utils.Address(toAddress);

    const jettonMaster = new TonWeb.token.jetton.JettonMinter(tonweb.provider, {
      address: JETTON_MASTER,
    });

    const jettonWallet = await jettonMaster.getWalletAddress(walletAddress);

    const payload = await jettonMaster.createTransferBody({
      jettonAmount,
      toAddress: destination,
      responseAddress: walletAddress,
      forwardAmount: TonWeb.utils.toNano("0.02"),
      forwardPayload: new TextEncoder().encode("RPG Reward 🪙"),
    });

    await wallet.methods
      .transfer({
        secretKey: keyPair.secretKey,
        toAddress: jettonWallet.toString(),
        amount: TonWeb.utils.toNano("0.05"), // small TON fee
        seqno,
        payload,
        sendMode: 3,
      })
      .send();

    console.log(`✅ Sent ${amount} RPG tokens to ${toAddress}`);

    res.json({
      success: true,
      message: `Sent ${amount} RPG tokens`,
      to: toAddress,
    });
  } catch (err) {
    console.error("❌ Jetton transfer error:", err);
    res.status(500).json({ error: "Failed to send RPG token" });
  }
});

// === START SERVER ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ TON Reward Server running on port ${PORT}`)
);