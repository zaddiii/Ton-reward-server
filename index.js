



import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { TonClient, WalletContractV4, internal } from "ton";
import { mnemonicToWalletKey } from "ton-crypto";

dotenv.config();
const app = express();
app.use(express.json());

app.use(cors({
  origin: ["https://zaddiii.github.io", "http://localhost:3000"],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
}));

// ✅ Initialize TON client
const toncenter = new TonClient({
  endpoint: process.env.TONCENTER_API,     // e.g. https://testnet.toncenter.com/api/v2/jsonRPC
  apiKey: process.env.TONCENTER_API_KEY,   // optional
});

let wallet, key;

// 🔐 Load wallet from mnemonic
async function initWallet() {
  if (wallet) return { wallet, key }; // prevent reload
  key = await mnemonicToWalletKey(process.env.OWNER_MNEMONIC.split(" "));
  wallet = WalletContractV4.create({ workchain: 0, publicKey: key.publicKey });
  console.log(`✅ Wallet loaded: ${wallet.address.toString(true, true, true)}`);
  return { wallet, key };
}

// ✅ Test route
app.get("/", (req, res) => res.send("🟢 TON Reward Server is Live"));

// 💸 Real Jetton reward route (updated)
app.post("/api/reward", async (req, res) => {
  try {
    const { to, amount } = req.body;

    if (!to) {
      console.log("⚠️ Missing 'to' field in request body:", req.body);
      return res.status(400).json({ ok: false, error: "Missing 'to' address" });
    }

    const { wallet, key } = await initWallet();
    const seqno = await toncenter.getWalletSeqno(wallet.address);

    console.log(`🎯 Sending ${amount || 100} Jettons to: ${to}`);

    const body = Buffer.from(
      JSON.stringify({
        op: "JettonTransfer",
        destination: to,
        amount: amount?.toString() || "100",
      })
    );

    const transfer = internal({
      to: process.env.JETTON_MASTER,
      value: "0.05", // TON fee
      body,
    });

    const msg = await wallet.createTransfer({
      seqno,
      secretKey: key.secretKey,
      messages: [transfer],
    });

    await toncenter.sendBoc(msg.toBoc());
    console.log(`✅ Jetton transfer broadcasted to ${to}`);

    res.json({ ok: true, tx: "Broadcasted to TON network" });
  } catch (err) {
    console.error("❌ Error sending Jettons:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));